import fs from 'node:fs';
import path from 'node:path';

// Private examples are optional; a clone renders the approved production artwork.
export function reviewMediaMode(root = process.cwd()) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/implementation/iadds-media-derivatives.json'), 'utf8'));
  const files = manifest.flatMap(asset => asset.derivatives.map(item => item.file));
  const present = files.filter(file => fs.existsSync(path.join(root, '.data/iadds-media', file)));
  if (present.length && present.length !== files.length) {
    throw Error(`Incomplete optional private media: ${present.length}/${files.length}. Restore the full private derivative set; see README.md.`);
  }
  return present.length ? 'local' : 'production';
}
