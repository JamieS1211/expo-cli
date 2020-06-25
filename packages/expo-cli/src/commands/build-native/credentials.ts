import { CredentialsSource, Keystore } from '../../credentials/credentials';
import { CredentialsProvider } from '../../credentials/provider';
import { BuilderContext } from './build';
import prompts from '../../prompts';
import log from '../../log';

export async function ensureCredentials(
  provider: CredentialsProvider,
  ctx: BuilderContext
): Promise<void> {
  const src = ctx.eas.credentialsSource;
  if (src === CredentialsSource.LOCAL) {
    await provider.useLocal();
  } else if (src === CredentialsSource.REMOTE) {
    await provider.useRemote();
  } else if (ctx.eas[provider.platform].workflow === 'managed') {
    if (await provider.hasLocal()) {
      await provider.useLocal();
    } else {
      await provider.useRemote();
    }
  } else if (ctx.eas[provider.platform].workflow === 'generic') {
    const hasLocal = await provider.hasLocal();
    const hasRemote = await provider.hasRemote();
    if (hasRemote && hasLocal) {
      if (!(await provider.isLocalSynced())) {
        log('Your local credentials.json is not the same as credentials on Expo servers');
        const { select } = await prompts({
          type: 'select',
          name: 'select',
          message: 'Which credentials you want to use for this build?',
          choices: [
            { title: 'Local credentials.json', value: 'local' },
            { title: 'Credentials stored on Expo servers.', value: 'remote' },
          ],
        });
        if (select === 'local') {
          await provider.useLocal();
        } else {
          await provider.useRemote();
        }
      }
    }
  }
}
