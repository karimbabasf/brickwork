import { CameraControls, Environment, Lightformer } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { EffectComposer, TiltShift2, ToneMapping, Vignette } from '@react-three/postprocessing'
import { N8AOPostPass } from 'n8ao'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { GoalBuild } from '../lib/derive'
import { BRICK_H, type SetLayout } from '../lib/layout'
import { useStore } from '../lib/store'
import { LOOKS, type Mood, type SetLook } from '../lib/theme'
import { FRAME_MS, useView } from '../lib/view'
import { Dust, FlyingBrick, HeldBrick, HOVER, LeavingBrick } from './Hand'
import { LabelTile, Plinth, PLINTH_H, Sweep } from './Set'
import { Towers, type TowersProps } from './Towers'

const FOV = 30
const AZIMUTH = 0.42 // a little right of centre, so the key light rakes across the faces
const POLAR = 1.1 // about 27 degrees above the table
const UP = new THREE.Vector3(0, 1, 0)

interface Pad {
  top: number
  bottom: number
  left: number
  right: number
}

function safeArea(w: number, h: number): Pad {
  if (w < 720) return { top: Math.min(210, h * 0.26), bottom: Math.min(250, h * 0.32), left: 14, right: 14 }
  return { top: 120, bottom: 236, left: 72, right: 72 }
}

/** Camera pose that frames a box inside the part of the screen the UI leaves free. */
function fitPose(box: THREE.Box3, azimuth: number, polar: number, vw: number, vh: number, pad: Pad) {
  const dir = new THREE.Vector3(Math.sin(azimuth) * Math.sin(polar), Math.cos(polar), Math.cos(azimuth) * Math.sin(polar))
  const forward = dir.clone().negate()
  const right = new THREE.Vector3().crossVectors(forward, UP).normalize()
  const up = new THREE.Vector3().crossVectors(right, forward).normalize()
  const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
  const tanH = tanV * (vw / vh)
  const yTop = 1 - (2 * pad.top) / vh
  const yBot = -1 + (2 * pad.bottom) / vh
  const xL = -1 + (2 * pad.left) / vw
  const xR = 1 - (2 * pad.right) / vw
  const corners: THREE.Vector3[] = []
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z))

  const cam = new THREE.Vector3()
  const v = new THREE.Vector3()
  const extents = (target: THREE.Vector3, r: number) => {
    cam.copy(target).addScaledVector(dir, r)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minDepth = Infinity
    for (const p of corners) {
      v.subVectors(p, cam)
      const depth = v.dot(forward)
      minDepth = Math.min(minDepth, depth)
      const x = v.dot(right) / (depth * tanH)
      const y = v.dot(up) / (depth * tanV)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
    return { minX, maxX, minY, maxY, minDepth }
  }

  const target = box.getCenter(new THREE.Vector3())
  let r = 60
  for (let pass = 0; pass < 3; pass++) {
    let lo = 1
    let hi = 4000
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) / 2
      const e = extents(target, mid)
      const fits = e.minDepth > 1 && e.maxX - e.minX <= xR - xL && e.maxY - e.minY <= yTop - yBot
      if (fits) hi = mid
      else lo = mid
    }
    r = hi
    const e = extents(target, r)
    target.addScaledVector(right, ((e.minX + e.maxX) / 2 - (xL + xR) / 2) * r * tanH)
    target.addScaledVector(up, ((e.minY + e.maxY) / 2 - (yBot + yTop) / 2) * r * tanV)
  }
  return { position: target.clone().addScaledVector(dir, r), target }
}

function Rig({ layout, height }: { layout: SetLayout; height: number }) {
  const controls = useRef<CameraControls>(null)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const editing = useStore((s) => s.editing)
  const film = useStore((s) => s.film)
  const filmFrame = useView((s) => s.filmFrame)
  const userMoved = useView((s) => s.userMoved)
  const fitNonce = useView((s) => s.fitNonce)
  const booted = useRef(false)
  const bump = useView((s) => s.bump)
  const flying = useStore((s) => s.flying)

  // A drop is a small scene: the camera pushes in on stop-motion steps while the brick
  // falls, then eases back out once it has landed.
  useEffect(() => {
    const c = controls.current
    if (!c || !flying || film) return
    const home = c.distance
    const path = [0.96, 0.92, 0.89, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.9, 0.93, 0.96, 0.99, 1]
    let i = 0
    const id = window.setInterval(() => {
      if (i >= path.length) return window.clearInterval(id)
      void c.dollyTo(home * path[i++], false)
      invalidate()
    }, FRAME_MS)
    return () => {
      window.clearInterval(id)
      void c.dollyTo(home, false)
      invalidate()
    }
  }, [flying, film, invalidate])

  // A hard landing jolts the view for two frames, like a bumped animation table.
  useEffect(() => {
    const c = controls.current
    if (!c || !bump || film) return
    const r = c.distance
    const jolt: [number, number][] = [
      [0.004, -0.008],
      [-0.003, 0.003],
      [0, 0],
    ]
    let i = 0
    const step = () => {
      if (i >= jolt.length) return window.clearInterval(id)
      const [x, y] = jolt[i++]
      void c.setFocalOffset(x * r, y * r, 0, false)
      invalidate()
    }
    const id = window.setInterval(step, FRAME_MS)
    step()
    return () => {
      window.clearInterval(id)
      void c.setFocalOffset(0, 0, 0, false)
    }
  }, [bump, film, invalidate])

  const box = useMemo(
    () =>
      new THREE.Box3(
        new THREE.Vector3(layout.minX, -PLINTH_H, layout.minZ),
        // Headroom for the brick held above the tallest tower, so holding never moves the camera.
        new THREE.Vector3(layout.maxX, Math.max(height, 2 * BRICK_H) + HOVER + BRICK_H, layout.maxZ),
      ),
    [layout, height],
  )

  useEffect(() => {
    const c = controls.current
    if (!c || film || userMoved) return
    const pad = safeArea(size.width, size.height)
    // The goal picker sits over the lower half; frame the plinth above it.
    if (editing) pad.bottom = Math.max(pad.bottom, size.width < 720 ? size.height * 0.52 : 470)
    const pose = fitPose(box, AZIMUTH, POLAR, size.width, size.height, pad)
    void c.setLookAt(pose.position.x, pose.position.y, pose.position.z, pose.target.x, pose.target.y, pose.target.z, booted.current)
    booted.current = true
    invalidate() // on-demand rendering: the controls only apply the move on the next frame
  }, [box, size.width, size.height, film, userMoved, fitNonce, editing, invalidate])

  // The film's camera moves on the same 12 fps frames as the bricks.
  useEffect(() => {
    const c = controls.current
    if (!c || !film) return
    const pose = fitPose(box, AZIMUTH - 0.5 + filmFrame * 0.0055, POLAR - 0.05, size.width, size.height, {
      top: size.height * 0.16,
      bottom: size.height * 0.16,
      left: 24,
      right: 24,
    })
    void c.setLookAt(pose.position.x, pose.position.y, pose.position.z, pose.target.x, pose.target.y, pose.target.z, false)
    invalidate()
  }, [film, filmFrame, box, size.width, size.height, invalidate])

  return (
    <CameraControls
      ref={controls}
      makeDefault
      enabled={!film}
      minPolarAngle={0.3}
      maxPolarAngle={1.42}
      minDistance={7}
      maxDistance={900}
      dollyToCursor
      smoothTime={0.32}
      draggingSmoothTime={0.08}
      onStart={() => useView.getState().set({ userMoved: true })}
    />
  )
}

function KeyLight({ layout, height, look, mood }: { layout: SetLayout; height: number; look: SetLook; mood: Mood }) {
  const dir = useRef<THREE.DirectionalLight>(null)
  const spot = useRef<THREE.SpotLight>(null)
  const invalidate = useThree((s) => s.invalidate)
  const [aim] = useState(() => new THREE.Object3D())
  const w = layout.maxX - layout.minX
  const d = layout.maxZ - layout.minZ
  const span = Math.max(w, d, height * 1.2) * 0.62 + 8
  const lift = Math.max(40, height * 1.4)

  useLayoutEffect(() => {
    const l = dir.current
    if (!l) return
    const cam = l.shadow.camera
    cam.left = -span
    cam.right = span
    cam.top = span
    cam.bottom = -span
    cam.near = 1
    cam.far = 600
    cam.updateProjectionMatrix()
    l.shadow.needsUpdate = true
    invalidate()
  }, [span, invalidate, mood])

  // Night: one lamp above the set, a pool of light that falls off into the dark studio.
  const lamp = new THREE.Vector3(-w * 0.28, Math.max(34, height * 1.25 + 22), d * 0.9 + 26)
  const focus = new THREE.Vector3(0, height * 0.32, 0)
  const reach = Math.hypot(w, d, height) * 0.5 + 4
  const dist = lamp.distanceTo(focus)
  const angle = Math.min(1.1, Math.atan(reach / dist) * 1.25)
  useLayoutEffect(() => {
    aim.position.copy(focus)
    aim.updateMatrixWorld()
    const l = spot.current
    if (l) {
      // A tight depth range keeps the shadow map's precision on the set, not the empty studio.
      l.shadow.camera.near = Math.max(2, dist - reach * 1.8)
      l.shadow.camera.far = dist + reach * 1.8
      l.shadow.camera.updateProjectionMatrix()
      l.shadow.needsUpdate = true
    }
    invalidate()
  })

  if (mood === 'night')
    return (
      <>
        <primitive object={aim} />
        <spotLight
          ref={spot}
          target={aim}
          position={lamp.toArray()}
          angle={angle}
          penumbra={0.75}
          decay={0}
          intensity={look.keyIntensity}
          color={look.key}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0006}
          shadow-normalBias={0.04}
          shadow-radius={5}
        />
      </>
    )
  return (
    <directionalLight
      ref={dir}
      position={[-lift * 0.62, lift * 1.15, lift * 0.78]}
      intensity={look.keyIntensity}
      color={look.key}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.00025}
      shadow-normalBias={0.035}
      shadow-radius={6}
    />
  )
}

function Effects({ look }: { look: SetLook }) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const ao = useMemo(() => {
    const p = new N8AOPostPass(scene, camera, size.width, size.height)
    p.configuration.aoRadius = 0.9
    p.configuration.distanceFalloff = 0.6
    p.configuration.intensity = 2.2
    p.configuration.color = new THREE.Color('#1c1812')
    p.setQualityMode('Medium')
    return p
    // The pass follows canvas size through the composer; rebuild only for a new camera or scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, camera])
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <primitive object={ao} />
      <TiltShift2 blur={0.07} taper={0.55} start={[0, 0.46]} end={[1, 0.46]} samples={8} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.3} darkness={look.vignette} />
    </EffectComposer>
  )
}

export interface StageProps extends TowersProps {
  mood: Mood
  height: number // world units of the tallest tower on screen
  labels: { id: string; name: string; count: number }[]
}

export function Stage(props: StageProps) {
  const { builds, layout, height, labels, mood } = props
  const look = LOOKS[mood]
  return (
    <Canvas
      shadows
      flat
      frameloop="demand"
      dpr={[1, 1.75]}
      gl={{ antialias: false, stencil: false, powerPreference: 'high-performance' }}
      camera={{ fov: FOV, near: 0.5, far: 2400, position: [30, 26, 64] }}
      onPointerMissed={() => useStore.getState().setInspect(null)}
    >
      <color attach="background" args={[look.fog]} />
      <fog attach="fog" args={[look.fog, look.fogNear, look.fogFar]} />
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemi]} />
      <KeyLight layout={layout} height={height} look={look} mood={mood} />
      <directionalLight position={[40, 18, 24]} intensity={look.fillIntensity} color={look.fill} />
      <Environment key={mood} resolution={256} frames={1} environmentIntensity={look.env}>
        <color attach="background" args={[look.envBg]} />
        <Lightformer form="rect" intensity={3} color="#fff3e4" position={[-8, 12, 8]} scale={[14, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#e6eeff" position={[12, 5, 6]} scale={[6, 10, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[0, 14, -12]} scale={[18, 3, 1]} target={[0, 0, 0]} />
      </Environment>
      <Sweep color={look.sweep} />
      <Plinth layout={layout} color={look.plinth} />
      {labels.map(
        (l, i) => layout.plots[i] && <LabelTile key={l.id} plot={layout.plots[i]} name={l.name} count={l.count} tile={look.tile} ink={look.print} />,
      )}
      <Towers {...props} />
      <HeldBrick builds={builds} layout={layout} />
      <FlyingBrick builds={builds as Map<string, GoalBuild>} layout={layout} />
      <LeavingBrick builds={builds} layout={layout} />
      <Dust />
      <Rig layout={layout} height={height} />
      <Effects look={look} />
    </Canvas>
  )
}
