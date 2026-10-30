# Промты для картинок Лилы

Игра уже умеет сама подхватывать картинки. Положите файл с нужным именем в нужную папку, и он появится в игре. Если какой-то картинки нет, игра покажет свой встроенный рисунок, так что делать всё сразу не обязательно.

## Как добавить картинку в игру

1. Сгенерируйте картинку в ChatGPT по промту ниже и скачайте её в формате PNG.
2. Переименуйте файл точно как указано, например `shiva.png`.
3. Откройте репозиторий на GitHub и перейдите в папку:
   - поля: [lila/img/boards](https://github.com/iliafreedive-del/Lila/tree/main/lila/img/boards)
   - кубики: [lila/img/dice](https://github.com/iliafreedive-del/Lila/tree/main/lila/img/dice)
   - фишки: [lila/img/tokens](https://github.com/iliafreedive-del/Lila/tree/main/lila/img/tokens)
4. Нажмите **Add file → Upload files**, перетащите файл и нажмите **Commit changes**.
5. Через 1–2 минуты обновите страницу игры.

Можно и проще: пришлите картинки в чат, я сам переименую, сожму и загружу.

## Общие правила (важно для всех промтов)

- Пишите промты на английском, как ниже: так качество стабильнее.
- **Поле:** квадрат 1024×1024. **Без сетки, цифр, текста, змей и стрел**: игра сама рисует клетки, надписи, змей и стрелы поверх картинки. Центр картинки должен быть спокойным, без мелкой детализации, иначе надписи на клетках будут плохо читаться.
- **Кубик:** квадрат 1024×1024, только текстура материала одной грани, **без точек**: точки игра рисует сама.
- **Фишки:** квадрат 1024×1024, **прозрачный фон**, ровная сетка 5×5 из 25 иконок одинакового размера, каждая по центру своей ячейки, без подписей.

---

## 1. Фоны полей (18 штук) → папка `lila/img/boards/`

К каждому промту можно дописать общий хвост:
`Square 1024x1024. No text, no letters, no numbers, no grid lines, no snakes, no arrows. Calm, low-detail center so overlaid text stays readable. Rich, high quality, painterly digital illustration.`

| Файл | Тема | Промт |
|---|---|---|
| `chakra.png` | Чакры | Soft pastel background of the seven chakras: a serene meditating silhouette in lotus pose, translucent and faint, with seven glowing chakra lotuses along the spine from red at the base to violet at the crown, gentle rainbow gradient from warm bottom to cool top, light mist, Indian spiritual art. |
| `cosmos.png` | Космос | Deep cosmic nebula in magenta, violet and teal, thousands of stars, a luminous woman meditating in lotus pose made of pink light at the center, seven glowing chakras along her spine, aura of soft light, mystical Indian spiritual poster style. |
| `shiva.png` | Шива | Lord Shiva in deep meditation on Mount Kailash at night, blue skin, crescent moon in his matted hair, river Ganga flowing from his locks, trishula trident and damaru drum beside him, snake around his neck, sacred Om glowing faintly in the starry sky, reverent traditional Indian painting style, deep blue and silver palette. |
| `krishna.png` | Кришна | Lord Krishna playing the flute under a kadamba tree by the Yamuna river at twilight, peacock feather in his crown, peacocks and cows around, lotus flowers on the water, deep royal blue and gold palette, devotional Indian miniature painting style, soft glow. |
| `lakshmi.png` | Лотос Лакшми | Goddess Lakshmi seated on a giant pink lotus rising from calm water, four arms, gold coins gently falling, two white elephants with raised trunks on the sides, soft pink, white and gold palette, delicate mandala in the background, traditional Indian devotional art. |
| `mandala.png` | Мандала | Huge intricate Indian mandala in coral, magenta and saffron on a deep plum background, a dark silhouette of a meditating figure in the center with glowing chakra points, symmetrical lotus petals radiating outward, henna-like ornamental detail at the edges. |
| `sriyantra.png` | Шри-янтра | Sacred Sri Yantra in gold lines on deep crimson red: nine interlocking triangles around a central bindu, two rings of lotus petals (8 and 16), square outer frame with four T-shaped gates, subtle gold leaf texture, temple art, perfectly symmetrical. |
| `metatron.png` | Куб Метатрона | Metatron's Cube sacred geometry made of glowing cyan and turquoise light lines over a dark teal starfield, thirteen circles connected by straight lines, faint flower of life pattern behind, luminous, mystical, precise symmetry. |
| `flower.png` | Цветок жизни | Flower of Life sacred geometry pattern in soft blue on a white and pale-sky background, a gentle translucent figure meditating in the center with softly glowing chakras, white light, airy, watercolor-like, peaceful. |
| `india.png` | Карта Индии | Antique illustrated map of ancient India (Bharata) in watercolor and ink: Himalayas in the north, rivers Ganga, Yamuna and Indus drawn in blue, small temple icons at holy cities (Varanasi, Haridwar, Mathura, Kanyakumari), ocean with waves and a compass rose, deep teal sea, warm saffron land, no text labels. |
| `oldmap.png` | Старинная карта | Old nautical parchment map, sepia and brown ink, rhumb lines radiating from compass roses, imaginary islands and coastlines, sea monsters and sailing ships drawn in ink at the edges, ornate decorative border, aged paper texture with stains, no text. |
| `starmap.png` | Звёздная карта | Vedic celestial star chart: zodiac wheel with twelve sign symbols around the edge, constellation lines and golden stars, nakshatra circles, deep navy blue night sky, golden ink, antique astronomical chart style, no text labels. |
| `himalaya.png` | Гималаи | Majestic snow-capped Himalayan peaks at dawn, prayer flags in the wind, a small stone temple on a ridge, soft mist in the valleys, pale blue and white palette, serene and spacious, light sky at the top. |
| `ocean.png` | Океан | Deep ocean seen from above, gradients from dark navy at the bottom to bright turquoise at the top, sunlight rays through water, gentle waves, a few dolphins and lotus petals floating, calm, luminous. |
| `forest.png` | Древо жизни | The Tree of Life (Ashvattha, sacred fig) with roots above and branches below as in the Bhagavad Gita, glowing leaves, deep green forest, fireflies, soft golden light through the canopy, mystical Indian art. |
| `sunset.png` | Закат над Гангом | Sunset over the Ganges at Varanasi, ghats with steps and temples on the shore, floating diya lamps on the water, huge orange sun with rays, sky from deep purple to gold, silhouettes of boats. |
| `neon.png` | Неон | Synthwave neon sacred geometry: glowing magenta and cyan Sri Yantra and Om lines on a pure black background, perspective grid, laser glow, futuristic. |
| `aqua.png` | Акварель | Soft multicolor watercolor washes and blooms on white paper, pastel pink, blue, mint and yellow, gentle lotus shapes, dreamy and light, lots of white space. |

---

## 2. Кубики (15 штук) → папка `lila/img/dice/`

Хвост для каждого промта:
`Close-up square texture of one face of a die, 1024x1024, flat front view, fills the whole frame, soft studio light, slightly rounded bevel at the edges. NO dots, NO pips, NO numbers, NO text.`

| Файл | Скин | Промт |
|---|---|---|
| `classic.png` | Классика | Glossy white plastic die face, clean, subtle reflections. |
| `ivory.png` | Слоновая кость | Antique carved ivory-colored bone surface, warm cream, fine grain, faint engraved border. |
| `ruby.png` | Рубин | Polished faceted ruby gemstone face, deep red, light sparkling inside. |
| `emerald.png` | Изумруд | Polished emerald gemstone face, deep green with inner light and inclusions. |
| `sapphire.png` | Сапфир | Polished sapphire gemstone face, royal blue, starlike inner sparkle. |
| `gold.png` | Золото | Brushed solid gold metal face with a fine engraved Indian ornament along the edges. |
| `onyx.png` | Оникс | Black polished onyx stone with thin golden veins. |
| `neon.png` | Неон | Black glass face with glowing magenta neon edges, synthwave style. |
| `wood.png` | Дерево | Natural carved sandalwood surface with visible grain, warm brown, matte. |
| `marble.png` | Мрамор | White Carrara marble with grey veins and a thin gold inlay border. |
| `lava.png` | Лава | Molten lava rock, black crust with glowing orange-yellow cracks. |
| `ice.png` | Лёд | Translucent ice cube face, frosty, light blue, tiny bubbles inside. |
| `amethyst.png` | Аметист | Polished amethyst crystal, purple, with lighter violet inner glow. |
| `rainbow.png` | Радуга | Iridescent holographic surface shifting through all rainbow colors, glossy. |
| `space.png` | Космос | Galaxy inside glass: purple and blue nebula, tiny stars, glossy dome reflection. |

---

## 3. Фишки (150 штук, 6 листов по 25) → папка `lila/img/tokens/`

Каждый лист — одна картинка с сеткой **5 на 5**. Порядок иконок: слева направо, сверху вниз, строго как в списке. Игра сама вырезает каждую фишку из листа.

Начало каждого промта:
`A 5x5 sprite sheet of 25 game tokens on a fully transparent background, 1024x1024. Each token is a round medallion of the same size, perfectly centered in its own equal square cell, with even spacing and no overlap. Style: glossy enamel and gold-rimmed amulets with Indian ornamental details, soft shading, consistent lighting, high detail. No text, no labels, no grid lines. Order left to right, top to bottom:`

Дальше допишите список для нужного листа:

**`sheet-1.png`:** elephant, lion, tiger face, walking tiger, leopard, monkey, fox, wolf, bear, panda, koala, rabbit, cat, dog, cow, pig, frog, monkey face, unicorn, horse, zebra, giraffe, deer, two-hump camel, one-hump camel.

**`sheet-2.png`:** turtle, snake, lizard, crocodile, dolphin, spouting whale, whale, fish, tropical fish, octopus, butterfly, honeybee, ladybug, owl, eagle, peacock, parrot, swan, white dove, penguin, flamingo, rooster, duck, snail, crab.

**`sheet-3.png`:** lobster, shark, hedgehog, bat, squirrel, otter, sloth, dragon, dragon face, T-rex, cherry blossom, hibiscus, sunflower, rose, tulip, lotus, daisy, bouquet, four-leaf clover, herb leaves, seedling, cactus, palm tree, deciduous tree, maple leaf.

**`sheet-4.png`:** fallen leaves, mushroom, sheaf of rice, white flower, hyacinth, ocean wave, fire flame, water drop, snowflake, lightning bolt, sun, crescent moon, star, glowing star, sparkles, dizzy star, comet, ringed planet, Earth globe, rainbow, cloud, milky way, sun with face, crescent moon with face, full moon with face.

**`sheet-5.png`:** new moon, full moon, half moon, bright sun symbol, shooting star, Om symbol, yin-yang, dharma wheel, six-pointed star with dot, star of David, peace symbol, hamsa hand, nazar evil eye amulet, prayer beads (mala), trishula trident, fleur-de-lis, Hindu temple, folded hands namaste, person in lotus meditation, diamond gem, eye, infinity sign, atom, spiral, diamond with dot.

**`sheet-6.png`:** crystal ball, diya oil lamp, candle, sparkling heart, purple heart, red apple, orange, lemon, watermelon slice, grapes, strawberry, cherries, mango, pineapple, coconut, peach, banana, blueberries, kiwi, honey pot, cup of green tea, cup of chai, dumpling, slice of cake, doughnut.

Если ChatGPT собьёт сетку (иконки разного размера или не по центру), попросите: *«Make every token exactly the same size, centered in a strict 5x5 grid of equal cells»*. Если и так не выйдет, пришлите картинку мне, я выровняю сетку сам.
