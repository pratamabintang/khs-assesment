import * as fs from 'fs';
import * as path from 'path';

export function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

export function resolveFrom(...parts: string[]): string {
  return path.join(process.cwd(), ...parts);
}
