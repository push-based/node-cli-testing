import {CliProject} from "./cli";
import {ProjectConfig} from "./types";

export class CliProjectFactory {
  static async create<T extends {}>(cfg: ProjectConfig<T>): Promise<CliProject<T>> {
    const prj = new CliProject<T>();
    await prj._setup(cfg);
    return prj;
  }
}
