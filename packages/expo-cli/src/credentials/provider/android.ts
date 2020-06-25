import { SetupAndroidKeystore } from '../views/SetupAndroidKeystore';
import { Keystore } from '../credentials';
import { runCredentialsManager } from '../route';
import { Context } from '../context';
import { credentialsJson } from '../local';
import { CredentialsProvider } from './provider';

export interface AndroidCredentials {
  keystore: Keystore;
}

interface Options {
  projectName: string;
  accountName: string;
}

export class AndroidCredentialsProvider implements CredentialsProvider {
  public readonly platform = 'android';
  private readonly ctx = new Context();
  private credentials?: AndroidCredentials;

  constructor(private projectDir: string, private options: Options) {}

  get projectFullName(): string {
    const { projectName, accountName } = this.options;
    return `@${accountName}/${projectName}`;
  }

  public async init() {
    await this.ctx.init(this.projectDir);
  }

  public async hasRemote(): Promise<boolean> {
    const keystore = await this.ctx.android.fetchKeystore(this.projectFullName);
    return this.isValidKeystore(keystore);
  }

  public async hasLocal(): Promise<boolean> {
    return await credentialsJson.exists(this.projectDir);
  }

  public async useRemote(): Promise<void> {
    await runCredentialsManager(
      this.ctx,
      new SetupAndroidKeystore(this.projectFullName, {
        allowMissingKeystore: false,
      })
    );
    const keystore = await this.ctx.android.fetchKeystore(this.projectFullName);
    if (!keystore || !this.isValidKeystore(keystore)) {
      throw new Error('Unable to set up credentials');
    }
    this.credentials = { keystore };
  }
  public async useLocal(): Promise<void> {}
  public async isLocalSynced(): Promise<boolean> {
    return true;
  }
  public async updateLocal(): Promise<void> {}
  public async getCredentials(): Promise<AndroidCredentials> {
    throw new Error('test');
  }

  private isValidKeystore(keystore?: Keystore | null) {
    return !!(
      keystore &&
      keystore.keystore &&
      keystore.keystorePassword &&
      keystore.keyPassword &&
      keystore.keyAlias
    );
  }
}
