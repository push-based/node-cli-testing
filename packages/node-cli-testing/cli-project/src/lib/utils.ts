import * as fs from 'fs';
import {ProcessParams, ProjectConfig} from './types';
import * as path from 'path';
import {CliProjectFactory} from "./factory";
import {CliProject} from "./cli";

export function getFolderContent(folders: string[]): string[] {
  return folders.flatMap((d) => {
    if (fs.existsSync(d)) {
      const files = fs.readdirSync(d);
      return files.map((f) => path.join(d, f));
    }
    return [d];
  });
}

export function deleteFileOrFolder(files: string | string[]): void {
  (typeof files === 'string' ? [files] : files).forEach((p) => {
    if (fs.existsSync(p)) {
      const stats = fs.lstatSync(p);
      if(stats.isDirectory()) {
        fs.rmdirSync(p, { recursive: true });
      } else {
        fs.rmSync(p);
      }
      // console.info(`Deleted file ${file}`);
    } else {
      // console.error(`File ${file} does not exist`);
    }
  });
}

export function processParamsToParamsArray(params: ProcessParams): string[] {
  return Object.entries(params).flatMap(([key, value]) => {
    if (key === '_') {
      return value.toString();
    } else if (Array.isArray(value)) {
      return value.map(v => `--${key}=${v.toString()}`);
    } else {
      if (typeof value === 'string') {
        return [`--${key}=${value + ''}`];
      } else if (typeof value === 'boolean') {
        return [`--${value ? '' : 'no-'}${key}`];
      }
      return [`--${key}=${value + ''}`];
    }
  }) as string[];
}

export function withProject<T extends {}>(
  cfg: ProjectConfig<T>,
  fn: (prj: CliProject<T>) => Promise<void>,
  factory: (cfg: ProjectConfig<T>) => Promise<CliProject<T>> = CliProjectFactory.create
): () => Promise<void> {  return async () => {
  let prj = await factory(cfg);
  await prj.setup();
  await fn(prj).finally(() => prj.teardown());
}
}
