# TXTELITE — Text Elite 1.5 (TypeScript port)

A TypeScript/Node.js port of Text Elite 1.5 by Ian Bell — a text-mode trading
game based on the BBC Micro game Elite. The original C source (`TXTELITE.C`)
is available at http://elitehomepage.org/text/index.htm

## Building

```sh
npm install
npx tsc
```

## Running

Interactive:

```sh
node dist/txtelite.js
```

Pipe a command script:

```sh
node dist/txtelite.js < spears.txt
```

## Commands

| Command             | Effect                                      |
|---------------------|---------------------------------------------|
| `mkt`               | Show current market prices                  |
| `b <good> <qty>`    | Buy trade good                              |
| `s <good> <qty>`    | Sell trade good                             |
| `f <qty>`           | Buy fuel (LY)                               |
| `j <planet>`        | Jump to planet (costs fuel)                 |
| `sneak <planet>`    | Jump with no fuel cost (cheat)              |
| `info <planet>`     | Show planet data                            |
| `local`             | List systems within 7 LY                    |
| `hold <n>`          | Set cargo bay size                          |
| `cash <n>`          | Add/subtract credits (cheat)                |
| `rand`              | Toggle RNG: SAS LCG ↔ platform `rand()`     |
| `galhyp`            | Jump to next galaxy                         |
| `q` or Ctrl-C       | Quit                                        |

Abbreviations are allowed: `b fo 5` = `buy food 5`, `m` = `mkt`, etc.

## Starting conditions

- Location: Lave (Galaxy 1)
- Cash: 100.0 CR
- Fuel: 7.0 LY
- Cargo bay: 20t

## RNG

The port defaults to the **SAS Institute LCG** (seeded at 12345), making all
market prices and planetary descriptions fully deterministic across platforms.
The `rand` command switches to the platform's native `rand()`, which is not
portable.

The initial Lave market is always deterministic regardless of RNG mode because
it uses `fluct=0x00` (hardcoded). All planet positions and inter-system
distances are also fixed, derived from the galaxy seed.

## Test scripts

| File           | Description                                                              |
|----------------|--------------------------------------------------------------------------|
| `spears.txt`   | Short narcotics/furs run: Lave→Zaonce→Bemaera→Ensoreus→Zaalela. Produces exactly **330.6 CR** with the SAS LCG default (fully deterministic). |
| `sinclair.txt` | Long multi-leg route with `cash -400` cheat. Used for T16 golden-file QA (line 1 `rand` toggle skipped). |

## Key planet data (Galaxy 1)

| Planet    | Position  | TL | Economy      | Government      |
|-----------|-----------|----|--------------|-----------------|
| Lave      | (20, 173) |  5 | Rich Agri    | Dictatorship    |
| Zaonce    | (33, 185) | 12 | Average Ind  | Corporate State |
| Bemaera   | (43, 176) |  5 | Poor Agri    | Democracy       |
| Ensoreus  | (33, 162) |  7 | Average Agri | Feudal          |
| Zaalela   | (18, 162) |  5 | Poor Agri    | Multi-Govt      |

Key distances:

| Leg                    | Distance |
|------------------------|----------|
| Lave → Zaonce          | 5.7 LY   |
| Zaonce → Bemaera       | 6.9 LY   |
| Bemaera → Ensoreus     | 5.3 LY   |
| Ensoreus → Zaalela     | 2.5 LY   |
