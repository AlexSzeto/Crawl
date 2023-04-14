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
    td: {
        sprite: sprites.create(ASSETS_PACK.PLAYER_TILE, SpriteKind.Player),
    },
    fp: {
        sprite: Render.getRenderSpriteVariable(),
    },
    aim: {
        tile: { x: 0, y: 0 },
        stage: { x: 0, y: 0 },
    },
    mode: ViewMode.raycastingView,
}
player.td.sprite.follow(player.fp.sprite)
player.td.sprite.setFlag(SpriteFlag.RelativeToCamera, true)


/********************************/
/*  MAP HANDLING                */
/********************************/

function loadMap(map: tiles.TileMapData) {
    tiles.setCurrentTilemap(map)

    const myStartTile = tiles.getTilesByType(ASSETS_PACK.PLAYER_TILE)[0]
    tiles.placeOnTile(player.fp.sprite, myStartTile)
    tiles.placeOnTile(player.td.sprite, myStartTile)
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
    
    player.td.sprite.setFlag(SpriteFlag.Invisible, mode != ViewMode.tilemapView)
    player.fp.sprite.setFlag(SpriteFlag.Invisible, mode != ViewMode.raycastingView)
    Render.setViewMode(mode)
}

/********************************/
/*  INPUT HANDLING              */
/********************************/

controller.pauseUntilAnyButtonIsPressed()

setViewMode(player.mode)
loadMap(tilemap`level`)

// let test = sprites.create(assets.image`shoji-door`, SpriteKind.Food)
// test.flags += sprites.Flag.RelativeToCamera
// tiles.placeOnTile(test, tiles.getTileLocation(2, 4))
controller.menu.onEvent(ControllerButtonEvent.Pressed, function() {
    player.mode = 1 - player.mode
    setViewMode(player.mode)
})

const player3D = player.fp.sprite
controller.up.onEvent(ControllerButtonEvent.Pressed, () => {

if( a !== va || player3D.vx != 0 || player3D.vy != 0) {
    return
}
    if(va < 45)
    player3D.vx = 64
    else if(va < 90 + 45)
    player3D.vy = 64
    else if(va < 180 + 45)
    player3D.vx = -64
    else
    player3D.vy = -64
})

player3D.fx = 128+64
player3D.fy = 128+64

let va = 0
let a = 0
controller.left.onEvent(ControllerButtonEvent.Pressed, () => {
    if(player3D.vx === 0 && player3D.vy === 0) {
        a -= 90
    }
    
})

controller.right.onEvent(ControllerButtonEvent.Pressed, () => {
    if (player3D.vx === 0 && player3D.vy === 0) {
        a += 90
    }
})

game.onUpdate(function() {


    va = (a + va * 3) / 4
    if(Math.abs(a-va) < 1) {
        va = a
        a = (a + 360) % 360
        va = (va + 360) % 360
    }
    Render.setViewAngleInDegree(va)

    if(player3D.vx==0 && player3D.vy==0) {
        
        tiles.placeOnTile(player3D, player3D.tilemapLocation())
    }
})