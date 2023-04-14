// Auto-generated code. Do not edit.
namespace myTiles {
    //% fixedInstance jres blockIdentity=images._tile
    export const transparency16 = image.ofBuffer(hex``);
    //% fixedInstance jres blockIdentity=images._tile
    export const tile1 = image.ofBuffer(hex``);
    //% fixedInstance jres blockIdentity=images._tile
    export const tile2 = image.ofBuffer(hex``);
    //% fixedInstance jres blockIdentity=images._tile
    export const tile4 = image.ofBuffer(hex``);
    //% fixedInstance jres blockIdentity=images._tile
    export const tile3 = image.ofBuffer(hex``);

    helpers._registerFactory("tilemap", function(name: string) {
        switch(helpers.stringTrim(name)) {
            case "level":
            case "level1":return tiles.createTilemap(hex`1000100002020202020200000000000000000000020000000002000000000000000000000200010000020200000000000000000002000000000200000000000000000000020200020202000000000000000000000200000000020000000000000000000002000000000200000000000000000000020000000002000000000000000000000202020202020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`, img`
2 2 2 2 2 2 . . . . . . . . . . 
2 . . . . 2 . . . . . . . . . . 
2 . . . . 2 . . . . . . . . . . 
2 . . . . 2 . . . . . . . . . . 
2 2 . 2 2 2 . . . . . . . . . . 
2 . . . . 2 . . . . . . . . . . 
2 . . . . 2 . . . . . . . . . . 
2 . . . . 2 . . . . . . . . . . 
2 2 2 2 2 2 . . . . . . . . . . 
. . . . . . . . . . . . . . . . 
. . . . . . . . . . . . . . . . 
. . . . . . . . . . . . . . . . 
. . . . . . . . . . . . . . . . 
. . . . . . . . . . . . . . . . 
. . . . . . . . . . . . . . . . 
. . . . . . . . . . . . . . . . 
`, [myTiles.transparency16,myTiles.tile3,myTiles.tile4], TileScale.Sixteen);
        }
        return null;
    })

    helpers._registerFactory("tile", function(name: string) {
        switch(helpers.stringTrim(name)) {
            case "transparency16":return transparency16;
            case "shoji-wall":
            case "tile1":return tile1;
            case "blank-tile":
            case "tile2":return tile2;
            case "dungeon-wall":
            case "tile4":return tile4;
            case "shoji-player":
            case "tile3":return tile3;
        }
        return null;
    })

}
// Auto-generated code. Do not edit.
