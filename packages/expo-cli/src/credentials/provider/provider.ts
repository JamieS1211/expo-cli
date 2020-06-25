export interface CredentialsProvider {
  readonly platform: 'android' | 'ios';
  hasRemote(): Promise<boolean>;
  hasLocal(): Promise<boolean>;
  useRemote(): Promise<void>;
  useLocal(): Promise<void>;
  isLocalSynced(): Promise<boolean>;
  updateLocal(): Promise<void>;
}
