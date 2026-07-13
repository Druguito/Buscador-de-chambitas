// Lee el argumento --perfil <nombre> (o --perfil=<nombre>, o -p <nombre>) de la
// línea de comandos. Sirve para tener perfiles separados tipo "por usuario":
// cada uno con su profile.<nombre>.yaml y su data/ofertas.<nombre>.json.
//
// Sin --perfil se devuelve undefined = el perfil por defecto (profile.yaml).
//
// Uso:  npm run buscar -- --perfil qa      → profile.qa.yaml
//       npm run panel  -- --perfil amigo   → data/ofertas.amigo.json

// Deja el nombre seguro para usarlo como parte de un nombre de archivo
// (solo minúsculas, números, guion y guion bajo; nada de rutas ni símbolos raros).
function sanear(nombre: string): string | undefined {
  const limpio = nombre.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return limpio || undefined;
}

export function perfilArg(argv: string[] = process.argv.slice(2)): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--perfil' || a === '-p') {
      return argv[i + 1] ? sanear(argv[i + 1]) : undefined;
    }
    if (a.startsWith('--perfil=')) {
      return sanear(a.slice('--perfil='.length));
    }
  }
  return undefined;
}
