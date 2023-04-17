
/********************************/
/*  UTIL FUNCTIONS              */
/********************************/
const weight = (left: number, right: number, leftRatio: number) => Math.abs(left - right) < 1 ? right : (left * leftRatio + right) / (leftRatio + 1)

/********************************/
/*  SORTED ON FRAME UPDATER     */
/********************************/
type UpdateFunctionItem = {
    execute: Function
    priority: number
}

const updateFunctions: UpdateFunctionItem[] = []
function addUpdateFunction(execute: Function, priority: number = 0) {
    updateFunctions.push({
        execute,
        priority,
    })
    updateFunctions.sort((a, b) => b.priority - a.priority)
}

game.onUpdate(() => {
    updateFunctions.forEach(item => item.execute())
})

/********************************/
/*  GAME SETTINGS               */
/********************************/
const SHOJI_PACK = {
    PLAYER_TILE: assets.tile`shoji-player`,
    TD: {
        BACKGROUND: assets.image`2d-shoji-background`
    },
    FP: {
        BACKGROUND: assets.image`3d-shoji-skybox`
    },
}

const ASSETS_PACK = SHOJI_PACK

const player = {
    td: sprites.create(ASSETS_PACK.PLAYER_TILE, SpriteKind.Player),
    fp: Render.getRenderSpriteVariable(),    
    mode: ViewMode.raycastingView,
}

player.td.setFlag(SpriteFlag.RelativeToCamera, true)

addUpdateFunction(() => {
    player.td.x = player.fp.x - scene.cameraLeft()
    player.td.y = player.fp.y - scene.cameraTop()
})

/********************************/
/*  MAP HANDLING                */
/********************************/

function loadMap(map: tiles.TileMapData) {
    tiles.setCurrentTilemap(map)

    const myStartTile = tiles.getTilesByType(ASSETS_PACK.PLAYER_TILE)[0]
    tiles.placeOnTile(player.fp, myStartTile)
    tiles.placeOnTile(player.td, myStartTile)
    tiles.setTileAt(myStartTile, assets.tile`blank-tile`)
}

function setViewMode(mode: ViewMode) {
    switch(mode) {
        case ViewMode.tilemapView:
            scene.setBackgroundImage(ASSETS_PACK.TD.BACKGROUND)
            break
        case ViewMode.raycastingView:
            scene.setBackgroundImage(ASSETS_PACK.FP.BACKGROUND)
            break
    }
    
    player.td.setFlag(SpriteFlag.Invisible, mode != ViewMode.tilemapView)
    // player.fp.setFlag(SpriteFlag.Invisible, mode != ViewMode.raycastingView)
    Render.setViewMode(mode)
}

/********************************/
/*  INPUT HANDLING              */
/********************************/

enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

type Coordinates = {
    x: number,
    y: number
}

type FPSpriteTracker = {
    sprite: Sprite
    aimPos: Coordinates
    angle: number
    aimAngle: number
}

const fpSpriteTracking:FPSpriteTracker[] = []
function getFPTracker(sprite: Sprite):FPSpriteTracker {
    let tracker = (fpSpriteTracking.find(tracker => tracker.sprite == sprite))
    if(tracker == null) {
        tracker = {
            sprite,
            aimPos: { x: sprite.x, y: sprite.y },
            angle: 0,
            aimAngle: 0,
        }
        fpSpriteTracking.push(tracker)
    }
    return tracker
}

function takeStep(sprite: Sprite, dir: Direction) {
    const tracker = getFPTracker(sprite)
    if(
        tracker.angle != tracker.aimAngle 
        || tracker.aimPos.x != sprite.x 
        || tracker.aimPos.y != sprite.y
    ) {
        return
    }

    const delta = (dir == Direction.UP) ? 1 : -1
    const current = sprite.tilemapLocation()
    let moveTo:tiles.Location = null
    switch(dirOf(sprite)) {
        case Direction.UP:
            moveTo = tiles.getTileLocation(current.col, current.row - delta)
            break
        case Direction.DOWN:
            moveTo = tiles.getTileLocation(current.col, current.row + delta)
            break
        case Direction.LEFT:
            moveTo = tiles.getTileLocation(current.col - delta, current.row)
            break
        case Direction.RIGHT:
            moveTo = tiles.getTileLocation(current.col + delta, current.row)
            break
    }

    if (!tiles.tileAtLocationIsWall(moveTo)) {
        tracker.aimPos.x = moveTo.x
        tracker.aimPos.y = moveTo.y
    }
}

function makeTurn(sprite: Sprite, dir: Direction) {
    const tracker = getFPTracker(sprite)
    if (
        tracker.angle != tracker.aimAngle
        || tracker.aimPos.x != sprite.x
        || tracker.aimPos.y != sprite.y
    ) {
        return
    }

    switch(dir) {
        case Direction.LEFT:
            tracker.aimAngle -= 90
            break
        case Direction.RIGHT:
            tracker.aimAngle += 90
            break
    }
}

function dirOf(sprite: Sprite): Direction {
    const tracker = getFPTracker(sprite)
    if(tracker.angle < 45) {
        return Direction.RIGHT
    } else if (tracker.angle < 135) {
        return Direction.DOWN
    } else if (tracker.angle < 225) {
        return Direction.LEFT
    } else if (tracker.angle < 315) {
        return Direction.UP
    } else {
        return Direction.RIGHT
    }
}

addUpdateFunction(() => {
    fpSpriteTracking.forEach(tracker => {
        tracker.sprite.x = weight(tracker.sprite.x, tracker.aimPos.x, 3)
        tracker.sprite.y = weight(tracker.sprite.y, tracker.aimPos.y, 3)

        let a = weight(tracker.angle, tracker.aimAngle, 3)
        Render.setViewAngleInDegree(a)
        tracker.angle = a
        if(Math.abs(tracker.aimAngle - tracker.angle) < 1) {
            tracker.aimAngle = (tracker.aimAngle + 360) % 360
            tracker.angle = tracker.aimAngle
        }
    })
})

setViewMode(player.mode)
loadMap(tilemap`level`)

// let test = sprites.create(assets.image`shoji-door`, SpriteKind.Food)
// test.flags += sprites.Flag.RelativeToCamera
// tiles.placeOnTile(test, tiles.getTileLocation(2, 4))

Render.moveWithController(0, 0)

controller.menu.onEvent(ControllerButtonEvent.Pressed, () => {
    player.mode = 1 - player.mode
    setViewMode(player.mode)
})

controller.left.onEvent(ControllerButtonEvent.Pressed, () => {
    makeTurn(player.fp, Direction.LEFT)    
})

controller.right.onEvent(ControllerButtonEvent.Pressed, () => {
    makeTurn(player.fp, Direction.RIGHT)
})

addUpdateFunction(() => {
    if(controller.left.isPressed()) {
        makeTurn(player.fp, Direction.LEFT)
    }

    if(controller.right.isPressed()) {
        makeTurn(player.fp, Direction.RIGHT)
    }

    if(controller.up.isPressed()) {
        takeStep(player.fp, Direction.UP)
    }
    if(controller.down.isPressed()) {
        takeStep(player.fp, Direction.DOWN)
    }
})