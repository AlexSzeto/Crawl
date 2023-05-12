
/********************************/
/*  EASED TRANSITION            */
/********************************/
namespace easing {
    export enum Curve {
        IN,
        OUT,
        LINEAR,
    }

    export type Animation = {
        start: number,
        end: number,

        duration: number,
        curve: Curve,
        multiplier: number,

        elapsed: number,
        value: number,
    }

    export function create(value: number, duration: number, curve: Curve, multiplier: number = 1.0): Animation {
        return {
            start: value,
            end: value,

            duration,
            curve,
            multiplier,

            elapsed: 0,
            value,
        }
    }

    export function reset(anim:Animation, start: number, end: number) {
        anim.start = start
        anim.end = end

        anim.elapsed = 0,
        anim.value = start
    }

    export function update(anim:Animation, elapsed: number) {
        anim.elapsed = Math.min(anim.elapsed + elapsed, anim.duration)    
        if(anim.elapsed == anim.duration) {
            anim.value = anim.end
        } else {
            let progress = anim.elapsed / anim.duration

            switch (anim.curve) {
                case Curve.IN:
                    progress = 1 - Math.cos(Math.pow(progress, anim.multiplier) * Math.PI * 0.5)
                    break
                case Curve.OUT:
                    progress = Math.sin(Math.pow(progress, 1 / anim.multiplier) * Math.PI * 0.5)
                    break
            }

            anim.value = anim.start + (anim.end - anim.start) * progress
        }
    }
}

/********************************/
/*  SORTED TIME BASED UPDATER   */
/********************************/
namespace timedUpdate {
    type UpdateFunctionItem = {
        execute: (elapsed?: number) => void
        priority: number
    }

    let timer: number = game.runtime()
    const items: UpdateFunctionItem[] = []

    export function add(execute: (elapsed?: number) => void, priority: number = 0) {
        items.push({
            execute,
            priority,
        })
        items.sort((a, b) => b.priority - a.priority)
    }

    game.onUpdate(() => {
        const elapsed = game.runtime() - timer
        items.forEach(item => item.execute(elapsed))
        timer = game.runtime()
    })
}

/*******************************/
/*  GRID BASED RAY TRACED 3D   */
/*******************************/

namespace grid3d {

    /****************************************/
    /*  SETUP                               */
    /****************************************/
    export type AssetPack = {
        topDown: {
            playerTile: Image,
            background: Image,
        },
        firstPerson: {
            background: Image,
        },
    }    
    let assetsPack: AssetPack = null

    type PlayerTracker = {
        td: Sprite,
        fp: Sprite,
        mode: ViewMode,
        allowMapModeMovement: boolean,
    }
    export let player: PlayerTracker = null

    export function setAssetPack(pack: AssetPack) {
        assetsPack = pack
        if (player != null) {
            sprites.destroy(player.td)
            player.td = sprites.create(assetsPack.topDown.playerTile)
        } else {
            player = {
                td: sprites.create(assetsPack.topDown.playerTile),
                fp: Render.getRenderSpriteVariable(),
                mode: ViewMode.raycastingView,
                allowMapModeMovement: false,
            }
        }
        player.td.setFlag(SpriteFlag.RelativeToCamera, true)
    }

    setAssetPack({
        topDown: {
            playerTile: image.create(1, 1),
            background: image.create(1, 1),
        },
        firstPerson: {
            background: image.create(1, 1),
        },
    })

    timedUpdate.add(() => {
        player.td.x = player.fp.x - scene.cameraLeft()
        player.td.y = player.fp.y - scene.cameraTop()
    })

    /****************************************/
    /*  MOVEMENT                            */
    /****************************************/
    export enum Facing {
        NORTH,
        SOUTH,
        WEST,
        EAST,
    }

    type FPSpriteTracker = {
        sprite: Sprite
        aim: {
            x: easing.Animation
            y: easing.Animation
            angle: easing.Animation
        }
        angle: number
    }

    const fpSpriteTracking: FPSpriteTracker[] = []
    function getTracker(sprite: Sprite): FPSpriteTracker {
        let tracker = (fpSpriteTracking.find(tracker => tracker.sprite == sprite))
        if (tracker == null) {
            tracker = {
                sprite,
                angle: 0,
                aim: {
                    x: easing.create(sprite.x, 500, easing.Curve.LINEAR),
                    y: easing.create(sprite.y, 500, easing.Curve.LINEAR),
                    angle: easing.create(0, 500, easing.Curve.LINEAR),
                }
            }
            fpSpriteTracking.push(tracker)
        }
        return tracker
    }

    export function setStepAttributes(sprite: Sprite, duration: number, curve: easing.Curve = easing.Curve.LINEAR, multiplier: number = 1.0) {
        const tracker = getTracker(sprite)
        tracker.aim.x.duration = duration
        tracker.aim.y.duration = duration
        tracker.aim.x.curve = curve
        tracker.aim.y.curve = curve
        tracker.aim.x.multiplier = multiplier
        tracker.aim.x.multiplier = multiplier
    }

    export function setTurnAttributes(sprite: Sprite, duration: number, curve: easing.Curve = easing.Curve.LINEAR, multiplier: number = 1.0) {
        const tracker = getTracker(sprite)
        tracker.aim.angle.duration = duration
        tracker.aim.angle.curve = curve
        tracker.aim.angle.multiplier = multiplier
    }

    export function step(sprite: Sprite, forward: boolean) {
        const tracker = getTracker(sprite)
        if (
            tracker.aim.angle.end != tracker.angle
            || tracker.aim.x.end != sprite.x
            || tracker.aim.y.end != sprite.y
        ) {
            return
        }

        const delta = forward ? 1 : -1
        const current = sprite.tilemapLocation()
        let moveTo: tiles.Location = null
        switch (dirOf(sprite)) {
            case Facing.NORTH:
                moveTo = tiles.getTileLocation(current.col, current.row - delta)
                break
            case Facing.SOUTH:
                moveTo = tiles.getTileLocation(current.col, current.row + delta)
                break
            case Facing.WEST:
                moveTo = tiles.getTileLocation(current.col - delta, current.row)
                break
            case Facing.EAST:
                moveTo = tiles.getTileLocation(current.col + delta, current.row)
                break
        }

        if (!tiles.tileAtLocationIsWall(moveTo)) {
            easing.reset(tracker.aim.x, sprite.x, moveTo.x)
            easing.reset(tracker.aim.y, sprite.y, moveTo.y)
        }
    }

    export function turn(sprite: Sprite, clockwise: boolean) {
        const tracker = getTracker(sprite)
        if (
            tracker.aim.angle.end != tracker.angle
            || tracker.aim.x.end != sprite.x
            || tracker.aim.y.end != sprite.y
        ) {
            return
        }

        easing.reset(tracker.aim.angle, tracker.angle, tracker.angle + (clockwise ? 90 : -90))
    }

    export function dirOf(sprite: Sprite): Facing {
        const tracker = getTracker(sprite)
        if (tracker.angle < 45) {
            return Facing.EAST
        } else if (tracker.angle < 135) {
            return Facing.SOUTH
        } else if (tracker.angle < 225) {
            return Facing.WEST
        } else if (tracker.angle < 315) {
            return Facing.NORTH
        } else {
            return Facing.EAST
        }
    }

    timedUpdate.add((elapsed: number) => {
        fpSpriteTracking.forEach(tracker => {
            easing.update(tracker.aim.x, elapsed)
            easing.update(tracker.aim.y, elapsed)
            easing.update(tracker.aim.angle, elapsed)

            tracker.sprite.x = tracker.aim.x.value
            tracker.sprite.y = tracker.aim.y.value

            let a = tracker.aim.angle.value
            if(tracker.sprite === player.fp) {
                Render.setViewAngleInDegree(a)
            }
            tracker.angle = (a + 360) % 360
            if (tracker.aim.angle.end == tracker.aim.angle.value) {
                easing.reset(tracker.aim.angle, tracker.angle, tracker.angle)
            }
        })
    })

    Render.moveWithController(0, 0)

    timedUpdate.add(() => {
        if(player.mode == ViewMode.raycastingView || player.allowMapModeMovement) {
            if (controller.left.isPressed()) {
                turn(player.fp, false)
            }
            if (controller.right.isPressed()) {
                turn(player.fp, true)
            }
            if (controller.up.isPressed()) {
                step(player.fp, true)
            }
            if (controller.down.isPressed()) {
                step(player.fp, false)
            }
        }
    })

    /****************************************/
    /*  MAPPING                             */
    /****************************************/

    export function placeOnTile(sprite: Sprite, tile: tiles.Location) {
        const tracker = getTracker(sprite)
        tiles.placeOnTile(sprite, tile)
        if(sprite === player.fp) {
            tiles.placeOnTile(player.td, tile)
        }
        easing.reset(tracker.aim.x, sprite.x, sprite.x)
        easing.reset(tracker.aim.y, sprite.y, sprite.y)
    }

    export function loadMap(map: tiles.TileMapData) {
        tiles.setCurrentTilemap(map)

        const myStartTile = tiles.getTilesByType(assetsPack.topDown.playerTile)[0]
        placeOnTile(player.fp, myStartTile)
        tiles.setTileAt(myStartTile, assets.tile`blank-tile`)
    }

    export function setViewMode(mode: ViewMode) {
        switch (mode) {
            case ViewMode.tilemapView:
                scene.setBackgroundImage(assetsPack.topDown.background)
                break
            case ViewMode.raycastingView:
                scene.setBackgroundImage(assetsPack.firstPerson.background)
                break
        }

        player.td.setFlag(SpriteFlag.Invisible, mode != ViewMode.tilemapView)
        player.fp.setFlag(SpriteFlag.Invisible, mode != ViewMode.raycastingView)
        Render.setViewMode(mode)
        player.mode = mode
    }
}

/********************************/
/*  GAME SETTINGS               */
/********************************/
const SHOJI_PACK: grid3d.AssetPack = {
    topDown: {
        playerTile: assets.tile`shoji-player`,
        background: assets.image`2d-shoji-background`
    },
    firstPerson: {
        background: assets.image`3d-shoji-skybox`
    }
}
grid3d.setAssetPack(SHOJI_PACK)

controller.menu.onEvent(ControllerButtonEvent.Pressed, () => {
    grid3d.player.mode = 1 - grid3d.player.mode
    grid3d.setViewMode(grid3d.player.mode)
})
grid3d.setStepAttributes(grid3d.player.fp, 300, easing.Curve.OUT)
grid3d.setTurnAttributes(grid3d.player.fp, 300, easing.Curve.OUT)
grid3d.loadMap(tilemap`level`)
grid3d.setViewMode(grid3d.player.mode)

// let test = sprites.create(assets.image`shoji-door`, SpriteKind.Food)
// test.flags += sprites.Flag.RelativeToCamera
// tiles.placeOnTile(test, tiles.getTileLocation(2, 4))

// const skel = sprites.create(assets.tile`blank-tile`)
// const skelanim = Render.createAnimations(
//     150,
//     assets.animation`skeleton-west`,
//     assets.animation`skeleton-south`,
//     assets.animation`skeleton-east`,
//     assets.animation`skeleton-north`,
// )
// skel.x = 128
// skel.y = 64
// skel.vx = 1
// skel.scale = 0.5
// Render.setSpriteAnimations(skel, skelanim)