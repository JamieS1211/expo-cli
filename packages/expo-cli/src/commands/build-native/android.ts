import { Android, Job, Platform } from '@expo/build-tools';

import { CredentialsSource, Keystore } from '../../credentials/credentials';
import { ensureCredentials } from './credentials';
import { credentialsJson } from '../../credentials/local';
import { AndroidCredentials, AndroidCredentialsProvider } from '../../credentials/provider';
import prompt from '../../prompts';
import { Builder, BuilderContext } from './build';
import { AndroidGenericPreset, AndroidManagedPreset } from './easJson';

interface Options {
  credentialsSource: CredentialsSource;
  parent?: {
    nonInteractive?: boolean;
  };
}

interface CommonJobPrperties {
  platform: Platform.Android;
  projectUrl: string;
  secrets: {
    keystore?: Android.Keystore;
  };
}

class AndroidBuilder implements Builder {
  private credentials?: AndroidCredentials;

  constructor(public readonly ctx: BuilderContext) {}

  public async ensureCredentials(): Promise<void> {
    if (!this.shouldLoadCredentials()) {
      return;
    }
    const provider = new AndroidCredentialsProvider(this.ctx.projectDir, {
      projectName: this.ctx.projectName,
      accountName: this.ctx.accountName,
    });
    await provider.init();
    await ensureCredentials(provider, this.ctx);
    this.credentials = await provider.getCredentials();
  }

  public async prepareJob(archiveUrl: string): Promise<Job> {
    const preset = this.ctx.eas.android;
    if (preset.workflow === 'generic') {
      return this.prepareGenericJob(archiveUrl, preset);
    } else if (preset.workflow === 'managed') {
      return this.prepareManagedJob(archiveUrl, preset);
    } else {
      throw new Error("Unknown workflow. Shouldn't happen");
    }
  }

  public async prepareJobCommon(archiveUrl: string): Promise<CommonJobPrperties> {
    const secrets = this.credentials
      ? {
          keystore: {
            keystoreDataBase64: this.credentials.keystore.keystore,
            keystorePassword: this.credentials.keystore.keystorePassword,
            keyAlias: this.credentials.keystore.keyAlias,
            keyPassword: this.credentials.keystore.keyPassword,
          },
        }
      : {};

    return {
      platform: Platform.Android,
      projectUrl: archiveUrl,
      secrets,
    };
  }

  private async prepareGenericJob(
    archiveUrl: string,
    preset: AndroidGenericPreset
  ): Promise<GenericAndroidJob> {
    return {
      ...this.prepareJobCommon(archiveUrl),
      type: 'generic',
      nativeProjectDirectory: 'android', // todo drop support for this option
      gradleCommand: this.ctx.eas.android,
    };
  }

  private async prepareManagedJob(
    archiveUrl: string,
    preset: AndroidManagedPreset
  ): Promise<GenericAndroidJob> {
    return {
      ...this.prepareJobCommon(archiveUrl),
      type: 'generic',
      nativeProjectDirectory: 'android', // todo drop support for this option
      gradleCommand: this.ctx.eas.android,
    };
  }

  private shouldLoadCredentials(): boolean {
    const preset = this.ctx.eas.android;
    return (
      preset.workflow === 'managed' || (preset.workflow === 'generic' && preset.withoutCredentials)
    );
  }

  private async resolveKeystorePath(): Promise<string> {
    if (this.ctx.eas.android.workflow !== 'generic') {
      throw new Error('keystorePath is valid only for generic workflow');
    }
    if (await credentialsJson.exists(this.ctx.projectDir)) {
      const credentials = await credentialsJson.read(this.ctx.projectDir);
      return credentials?.android?.keystore?.keystorePath;
    } else {
      return './android/keystores/keystore.jks';
    }
  }
  //
  //    const keystore = await ctx.android.fetchKeystore(experienceName);
  //    await this.readCredentialsJson();
  //
  //    if (this.options.clearCredentials) {
  //      if (this.options.parent?.nonInteractive) {
  //        throw new BuildError(
  //          'Clearing your Android build credentials from our build servers is a PERMANENT and IRREVERSIBLE action, it\'s not supported when combined with the "--non-interactive" option'
  //        );
  //      }
  //      await runCredentialsManager(ctx, new RemoveKeystore(experienceName));
  //    }
  //
  //    const paramKeystore = await getKeystoreFromParams(this.options);
  //    if (paramKeystore) {
  //      await useKeystore(ctx, experienceName, paramKeystore);
  //    } else {
  //         }
  //
  //  }
  //
  //  async prepareRemote() {
  //    const ctx = new Context();
  //    await ctx.init(this.projectDir);
  //    const experienceName = `@${ctx.manifest.owner || ctx.user.username}/${ctx.manifest.slug}`;
  //
  //    await runCredentialsManager(
  //      ctx,
  //      new SetupAndroidKeystore(experienceName, {
  //        nonInteractive: this.options.parent?.nonInteractive,
  //      })
  //    );
  //
  //  }
  //
  //  async readLocal() {
  //    const credJson = credentialsJson.read(this.projectDir)
  //
  //  }
}

export { AndroidBuilder };
