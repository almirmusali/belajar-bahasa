#!/usr/bin/env python3
"""Сборка промптов иллюстраций из таблицы сцен и стайл-библии.

    python3 scripts/build-illustration-prompts.py the-marauders

Промпты не пишутся руками по одному: сцена задаётся одной строкой, а общий
стиль и палитра части подмешиваются к ней здесь. Поэтому книга выглядит
единой, а после правки текста достаточно поправить таблицу и пересобрать.

id сцены = id главы в <slug>.json. Проверка этого соответствия — часть сборки:
при расхождении скрипт падает, иначе картинки молча встанут не к тем главам.
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

STYLE = (
    "Muted watercolor and ink book illustration in the tradition of classic British "
    "storybooks. Loose expressive linework, soft translucent washes, visible paper "
    "texture. Cinematic composition, strong single light source. Nostalgic and "
    "melancholic, a memory recalled decades later. Painterly and restrained, never "
    "photographic. No text, no letters, no captions, no borders, no watermark."
)

# Палитра идёт по частям книги: замок тёплый, война выцветает, финал почти монохром.
PALETTE = {
    "one": (
        "Warm palette: amber candlelight and firelight against deep blue-grey shadows, "
        "golden autumn, Scottish green."
    ),
    "two": (
        "Cooling palette: overcast grey-blue, colour draining out of the world, warmth "
        "surviving only in small islands of lamplight."
    ),
    "three": (
        "Ashen near-monochrome palette: night, smoke, fog and wet stone, with a single "
        "warm accent somewhere in the frame."
    ),
}

# Карточки внешности — подставляются только тем, кто есть в кадре.
WHO = {
    "james": "a lean boy with messy jet-black hair sticking up in all directions and round glasses",
    "sirius": "a strikingly handsome boy with long dark hair and grey eyes",
    "remus": "a pale tired boy with light-brown hair and faint thin scars",
    "peter": "a small round boy with mousy blond hair and watery blue eyes",
    "lily": "a girl with dark red hair to her shoulders and bright green eyes",
}

# (id, часть, сцена, настроение)
SCENES = [
    (0, "one", "An old man's writing desk at night, seen close and empty of people: a small brass lamp with a green glass shade burning, a cup of cold tea, an old parchment map unrolled across the wood, a pen laid down mid-sentence, an empty chair pushed back.", "quiet, elegiac"),
    (1, "one", "A page of character studies on bare paper: four eleven-year-old boys in school robes standing loosely together, and a little apart from them a red-haired girl, each figure sketched separately with air around them.", "curious, introductory"),
    (2, "one", "A pale eleven-year-old boy alone in a dim narrow hallway, holding an opened letter in both hands, late summer light falling through the window behind him, a man's shadow in the doorway beyond.", "fragile, hopeful"),
    (3, "one", "A small train compartment on a rainy September afternoon, green English fields streaming past the window. A boy with messy black hair and round glasses hands a box of sweets back to a small round boy like a king giving gold; a long-haired boy sprawls laughing with his feet on the seat; a grey-skinned boy sits apart in the corner. Chocolate frogs and an owl cage.", "warm, fateful"),
    (4, "one", "Night on a black lake: little boats crossing by themselves, eleven-year-old children huddled together, a huge bearded giant holding a lamp at the front of the first boat. Above them a castle of a hundred towers and a thousand warm yellow windows stands on a mountain, its whole reflection trembling upside down in the water.", "awed, yearning"),
    (5, "one", "A vast hall with no ceiling, only black night sky and a thousand candles burning in the air above four long tables of watching faces. On a stool at the front, a boy sits with an enormous shabby pointed hat fallen over his eyes.", "suspenseful, ceremonial"),
    (6, "one", "A round tower dormitory on a winter evening: four beds with red curtains, ice flowers grown on the inside of the window, clothes and books and sweet papers everywhere. By the fire a dark-haired boy watches a black-and-green letter burn to ash while another boy simply sits beside him, saying nothing.", "cosy, wounded"),
    (7, "one", "The bottom of a night garden: a small wooden shed with a heavy door and a strong iron lock, standing alone under an enormous full moon. Far behind it, one lit kitchen window of a house.", "lonely, ominous"),
    (8, "one", "A boy's bedside at night behind half-drawn curtains: a small brass lamp with a green glass shade newly arrived on the table, an open book, no note. Across the dark room another boy lies reading a magazine upside down, not looking up.", "tender, unspoken"),
    (9, "one", "An October evening in the round dormitory: three boys sitting close together on a bed over a sheet of paper covered with dates and small drawn circles like moons. In the doorway, a grey hollow-eyed boy has stopped dead, still holding his bag.", "tense, exposed"),
    (10, "one", "The same room minutes later: the grey boy sitting on the edge of the bed crying, a small round boy pressing his very last sweets into his hand, a third boy sitting on the floor with his back against the bed, waiting, saying nothing.", "tender, releasing"),
    (11, "one", "A school library by candlelight: a huge old book dropped onto the table with dust flying up like smoke, a boy with round glasses leaning over it with his glasses shining, two other boys closing in on either side of a fourth so that he is completely surrounded by towers of books.", "conspiratorial, devoted"),
    (12, "one", "A cold empty stone corridor at night. A boy has taken off his round glasses and holds them in his hand, looking steadily at another boy; two more watch from against the wall, unusually still. One small lamp far down the corridor.", "serious, decisive"),
    (13, "one", "A school bathroom floor, grey light from a high window: a small round boy sitting with his back against the wall, his open hands lying useless in his lap, crying. Another boy stands in the doorway without coming in.", "defeated, kindly"),
    (14, "one", "A common room after midnight lit only by dark red coals: where three boys stood there now stand a tall young stag with new antlers, a big shaggy grey dog and a small rat. On the stairs a boy has collapsed, his legs gone from under him, staring.", "joyful, miraculous"),
    (15, "one", "Four in the morning by a dying fireplace, four mismatched cups of badly made tea. A boy in his night clothes stands on the table pointing a teaspoon like a wand while the others laugh up at him.", "absurd, golden"),
    (16, "one", "A hilltop at three in the morning under an enormous full moon: a wolf and a big grey dog running shoulder to shoulder, a stag ahead of them like a king, and a small rat riding between the stag's antlers. Far below, the scattered warm lights of a sleeping village.", "wild, exultant"),
    (17, "one", "Two o'clock in the morning on the slate roof above a tower: four boys lying and sitting among the slates under an enormous field of stars, one flat on his back with his hands behind his head looking up, one wrapped in a shared blanket, food spread between them.", "still, intimate"),
    (18, "one", "A late-night dormitory: four sixteen-year-olds bent over a large sheet of parchment by candlelight, tiny inked footprints moving along drawn corridors across it. Ink pots, quills, a spilled bottle, faces lit from below.", "clever, mischievous"),
    (19, "one", "A cold stone corridor: a thin boy with lank black hair and old worn clothes passing a pale tired boy going the other way, the two of them exchanging one glance in the moment they draw level. Nobody else in the corridor.", "watchful, uneasy"),
    (20, "one", "A black earthen tunnel under thick tree roots, a small circle of moonlight at its far mouth. A boy hauls another boy bodily back up the passage; behind them, at the dark end of the tunnel, two eyes catch the light.", "terrifying, urgent"),
    (21, "one", "A grey morning in the round dormitory: two beds, one boy lying awake with his face to the wall, another sitting on the edge of his own bed with his head down and his hands hanging. The space of floor between the beds very wide.", "estranged, aching"),
    (22, "one", "A sunlit school courtyard: a red-haired girl, furious and magnificent, telling off a strutting boy with round glasses in front of a laughing crowd. At the edge of the crowd a thin dark-haired boy watches without laughing.", "bright, bittersweet"),
    (23, "one", "A hot afternoon on the grass by a lake, students scattered everywhere after an exam. A thin dark-haired boy on the ground with grass in his hair; a red-haired girl turning her back on a boy with glasses to help him up; the crowd's laughter dying away.", "cruel, pivotal"),
    (24, "one", "A grand front doorstep at two in the morning in summer rain. A boy of sixteen stands there with one bag and a split lip and a face like a closed door, lit by the warm gold spilling out of the opened door where two kind old people stand.", "wounded, sheltering"),
    (25, "one", "A common room notice board with a newspaper page pinned to it and a line of ink written underneath, firelight on the students' turned backs. Through the window behind them, very small and far away, a green skull-and-snake mark burning in the night sky.", "foreboding, hushed"),
    (26, "one", "A slate roof above a tower at sunrise: four eighteen-year-olds watching the sun come up over a lake turning pink, a giant squid making slow circles far below. One of them stands, his glasses flashing in the light, saying something to the other three.", "solemn, golden"),
    (27, "two", "Four young people walking out through castle gates, seen from behind with their trunks. The castle behind them is warm and golden; the horizon ahead is darkening at the edges like a sheet of paper beginning to burn. The smallest of the four trails half a step behind.", "ominous, foreboding"),
    (28, "two", "A dim back room above a pub, curtains drawn, evening. A tired old teacher sets four cups of tea down in front of four young men; the lamplight is low and not one of the hands reaching for a cup is steady.", "dread, resolve"),
    (29, "two", "A huge black motorbike flying low over dark fields at night, its rider's hair streaming back, moonlit cloud above and the small lights of houses far below.", "defiant, roaring"),
    (30, "two", "A meeting by candlelight in a sealed kitchen: twenty-odd fighters crowded round a rough table, among them a scarred old man with a ruined face, a young half-giant, and an old wizard with half-moon glasses at the head of the table. In the corner, unnoticed by anyone, a small soft man sits listening.", "defiant, doomed"),
    (31, "two", "A camp at the edge of the world: old farm buildings in bare hills, a fire burning low, ragged people sitting around it in the cold. A man of about fifty holds a worn photograph of two young daughters; a visitor sits on the ground among them, arguing quietly and losing.", "bleak, honest"),
    (32, "two", "An autumn garden at sunset: little lights coming on in the apple trees, kitchen tables carried out onto the grass. A barefoot bride in her mother's dress teaches a bewildered older man to wave a wand; a small man is asleep in a chair with cake on his shirt; two friends stand shoulder to shoulder at the fence looking out at the darkening fields.", "joyful, elegiac"),
    (33, "two", "A dark corner of a pub: a soft round-faced man with wet eyes sits at a table over a half-pint, leaning slightly towards a smooth stranger whose face stays entirely in shadow. Firelight warms one side of the small man's face.", "insidious, pitiable"),
    (34, "two", "A single small figure walking away down a slope so gentle it is almost invisible, into thick fog. Faint footprints behind him. No horizon, no landmark, nothing to mark how far down he has already gone.", "quiet, dreadful"),
    (35, "two", "A kitchen on a July morning: a red-haired young woman stands at the table folding a letter into four and smoothing it flat with her hand, over and over, long after it is flat. A young man sits motionless with his glasses in his hands; another stands at the window like a man guarding a house that has already been robbed.", "numb, grieving"),
    (36, "two", "A sealed kitchen, curtains pinned shut, one lamp over a table ringed by tired faces. Painted faintly into the air between two of them, as if half-remembered, a small closed wooden drawer.", "poisoned, watchful"),
    (37, "two", "A warm bedroom in early August: a three-day-old baby with impossible black hair opening his green eyes. A young man holds him carefully, his whole guarded face fallen open; another young man's arm rests across his shoulders.", "tender, shadowed"),
    (38, "two", "A small lit cottage room at night: an old wizard with half-moon glasses speaking quietly to a young couple, a cot standing behind them in the shadow. The couple's faces are receiving the worst sentence a parent can hear. Black window.", "grave, cold"),
    (39, "two", "A cottage on a village lane painted twice in the same frame: one half of it solid, lit and real, the other half dissolving into empty wet grass as though it had never been built there at all.", "uncanny, protective"),
    (40, "two", "A cottage kitchen in late October, firelight and tea, a child's stuffed toy on the floor, a clock ticking on the shelf. A young couple lean towards a soft wet-eyed man with bright, relieved, trusting faces, asking him for a favour.", "intimate, horrifying"),
    (41, "two", "A bare rented room at night: a young man sitting on the end of a borrowed bed, holding a small hand mirror and looking at his own reflection in it instead of the face he had been speaking to. Darkness all round him.", "isolated, regretful"),
    (42, "two", "Rain on a village lane at dusk on the last day of October, seen from the road: a young woman on the front step carving a pumpkin, the cottage windows lit gold behind her, wet leaves on the path.", "quiet, dread-laden"),
    (43, "three", "The first grey light of the first of November: the silhouette of a small cottage with its roof torn open, thin smoke still standing straight up in the drizzle, dead leaves blown along an empty lane. No people anywhere.", "desolate, grieving"),
    (44, "three", "A tall cloaked figure walking down the middle of a village lane through falling leaves on Halloween night, past lit windows and small children in paper masks who do not look up. Ahead of him a hidden cottage appears as though a curtain had been drawn aside: lit windows, a garden gate, a pumpkin on the step.", "inexorable, dreadful"),
    (45, "three", "The inside of a wrecked cottage seen from the blown-in front door: an empty hallway, the staircase beyond it, and through a doorway a wand lying forgotten on the arm of a sofa. Plaster dust in the air, half the ceiling down, no figures.", "hollow, unbearable"),
    (46, "three", "The dark garden of a smoking, roof-torn cottage in cold rain: a hollow-eyed young man lifts a baby with a fresh lightning-shaped cut on his forehead up into the arms of a weeping giant, while a big black motorbike stands beside them.", "shattered, sacrificial"),
    (47, "three", "A London street at midday blown open: a smoking crater in the pavement, wreckage and abandoned shopping, twenty cloaked figures with wands drawn forming a ring around one man standing alone in the middle of it. A drain grate in the foreground.", "monstrous, tragic"),
    (48, "three", "A stone cell in a sea fortress: one barred window high in the wall, grey light falling on a young man sitting on the floor with his back against the stone. Beyond the bars, black water to the horizon.", "cold, endless"),
    (49, "three", "A grey shop doorway on a November morning: a shabby young man standing alone with a newspaper shaking in his hands, a front-page photograph of a ruined cottage and headlines stacked like graves. Behind him, out of focus, strangers in the street are celebrating.", "bereft, hollow"),
    (50, "three", "A rented room at the top of a flight of stairs: a narrow bed, a cheap table, a coat far older than the man wearing it, a calendar on the wall with circles drawn on it, and a heavy door with a lock at the bottom of the stairs.", "worn, solitary"),
    (51, "three", "A dark classroom in the castle: a shabby tired teacher in a worn cardigan stands just behind a thirteen-year-old boy as a great silver stag comes out of the boy's wand and fills the whole room with light.", "luminous, aching"),
    (52, "three", "A boarded upstairs room in a ruined house by night, moonlight coming through the gaps in the boards: a worn teacher out of breath in the doorway, a skeletal wild-haired man with his wand raised, and a soft balding man with wet eyes on his knees between them.", "feverish, final"),
    (53, "three", "The same boarded room: a thirteen-year-old boy in school clothes steps out between two raised wands and the man kneeling on the floor, his arms spread, saying no.", "brave, redemptive"),
    (54, "three", "A spring morning at a desk by a window: an aging man with grey at his temples, a cup of cold tea, the small brass lamp with the green glass shade still burning, and an old parchment map spread open with tiny named footprints moving along its drawn corridors.", "elegiac, faithful"),
]

COVER = (
    # Обложке нужен свой кадр, а не повтор 16-й главы: вертикаль, крупные силуэты,
    # читаемые на маленькой карточке в списке книг. Крыса, отвернувшаяся от своих,
    # говорит главное о книге без единого слова — и это не спойлер: имя предателя
    # названо на первой странице.
    "A vertical book cover composition. An enormous full moon hangs high in the frame "
    "and fills the upper sky; below it, low across the bottom, runs a dark hilltop "
    "ridge. Along that ridge, in strong silhouette against the moonlight, a stag with "
    "new antlers, a big shaggy dog and a wolf move together in one direction. A little "
    "apart from them a small rat sits motionless, turned the other way. Wide empty sky "
    "above the animals with room to breathe at the top of the frame. Bold simple "
    "shapes and high contrast between the pale moon and the dark ridge, so the image "
    "still reads clearly when it is very small."
)


def build(slug):
    book = json.loads((REPO / "data" / "reading" / f"{slug}.json").read_text())
    chapters = {c["id"]: c["title"] for c in book["chapters"]}

    missing = [i for i, *_ in SCENES if i not in chapters]
    extra = [i for i in chapters if i not in {s[0] for s in SCENES}]
    if missing or extra:
        print(f"РАСХОЖДЕНИЕ С КНИГОЙ: нет глав {missing}, не описаны главы {extra}", file=sys.stderr)
        return 1

    out = []
    for cid, part, scene, mood in SCENES:
        out.append({
            "id": cid,
            "file": f"ch-{cid}",
            "chapter": chapters[cid],
            "aspect": "3:2",
            "prompt": f"{STYLE} {PALETTE[part]} {scene} Mood: {mood}.",
        })
    out.append({
        "id": 100,
        "file": "cover",
        "cover": True,
        "chapter": "обложка",
        "aspect": "3:4",
        "prompt": f"{STYLE} {PALETTE['one']} {COVER} Mood: iconic, mythic, quietly ominous.",
    })

    dest = REPO / "data" / "reading" / "illustrations" / f"{slug}.prompts.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"собрано сцен: {len(out)} (глав {len(SCENES)} + обложка) → {dest}")
    return 0


if __name__ == "__main__":
    sys.exit(build(sys.argv[1] if len(sys.argv) > 1 else "the-marauders"))
