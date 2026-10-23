import type { VacuulaMapData } from '../../components/map/types'

const WIDTH = 60
const HEIGHT = 40

// 0 = unexplored, 1 = floor, anything else = wall
function cell(x: number, y: number) {
    if (x < 4 || x > 55 || y < 4 || y > 35) return 0
    if (x === 4 || x === 55 || y === 4 || y === 35) return 2
    if (x === 30 && (y < 15 || y > 22)) return 2
    return 1
}

function rle() {
    const out: [number, number][] = []
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const value = cell(x, y)
            const last = out[out.length - 1]
            if (last && last[0] === value) last[1]++
            else out.push([value, 1])
        }
    }
    return out
}

export function mapData(inMapsList: boolean): VacuulaMapData {
    return {
        width: WIDTH,
        height: HEIGHT,
        downsample: 1,
        map_type: 'floor',
        legend: { 0: 'unknown', 1: 'floor', 2: 'wall' },
        rle: rle(),
        metadata: { resolution: 50, origin_x: 0, origin_y: 0 },
        img_size: [WIDTH, HEIGHT],
        in_maps_list: inMapsList,
        base: [1500, 1000, 90],
    }
}
