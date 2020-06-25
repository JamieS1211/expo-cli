import { Job } from '@expo/build-tools';

import { CredentialsSource, Keystore } from '../../credentials/credentials';
import { Context } from '../../credentials/context';
import { SetupAndroidKeystore } from '../../credentials/views/SetupAndroidKeystore';
import { runCredentialsManager } from '../../credentials/route';
import { Builder, BuilderContext } from './build';

interface Options {
  credentialsSource: CredentialsSource;
  parent?: {
    nonInteractive?: boolean;
  };
}

class iOSBuilder implements Builder {
  constructor(public readonly ctx: BuilderContext) {}

  async ensureCredentials(): Promise<void> {}

  async prepareJob(archiveUrl: string): Promise<Job> {
    throw new Error('aaa');
  }
}

export { iOSBuilder };
