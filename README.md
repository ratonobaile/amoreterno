# Entre Dois Mundos — base 2D
Rodar: `python3 -m http.server 8000` na pasta e abrir http://localhost:8000 (necessário para carregar sprites).
Arte: coloque `idle/run/jump/fall/attack/hurt/death/transform.png` em `assets/characters/her|me/` e ajuste `SPR` (fw, fh, n, dur, ox, oy) em game.js.
Textos/nomes/dedicatória: objeto `CFG` no topo de game.js. Fases: objeto `LV`. Inimigos: `EN`. Personagens: `CH`.
Teste interno: no console, `__game.selfTest()`.

## Novidades
- `dialogos.js`: títulos, nomes, falas e finais.
- Menu > Teste de sprites: ajuste escala/hitbox e veja cada animação.
- Portas/interruptores: dados `dr` e `sw` em cada fase (tecla E no interruptor).
- Música gerada pelo navegador; volumes em Configurações.
