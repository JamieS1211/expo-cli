import path from 'path';

import Joi from '@hapi/joi';
import { Platform } from '@expo/build-tools';
import fs from 'fs-extra';

import { CredentialsSource } from '../../credentials/credentials';

type Workflow = 'generic' | 'managed';

export interface AndroidManagedPreset {
  workflow: 'managed';
  buildType?: 'app-bundle' | 'apk';
}

export interface AndroidGenericPreset {
  workflow: 'generic';
  buildCommand?: string;
  artifactPath?: string;
  keystorePath: string;
  withoutCredentials?: boolean;
}

export interface iOSManagedPreset {
  workflow: 'managed';
  buildType?: 'archive' | 'simulator';
}

export interface iOSGenericPreset {
  workflow: 'generic';
}

type AndroidPreset = AndroidManagedPreset | AndroidGenericPreset;
type iOSPreset = iOSManagedPreset | iOSGenericPreset;

interface EasJson {
  credentialsSource?: CredentialsSource;
  android?: { [key: string]: AndroidManagedPreset | AndroidGenericPreset };
  ios?: { [key: string]: iOSManagedPreset | iOSGenericPreset };
}

// EasConfig represents eas.json with one specific preset
export interface EasConfig {
  credentialsSource: CredentialsSource;
  android: AndroidManagedPreset | AndroidGenericPreset;
  ios: iOSManagedPreset | iOSGenericPreset;
}

const EasJsonSchema = Joi.object({
  credentialsSource: Joi.string().valid('local', 'remote', 'auto'),
  android: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      workflow: Joi.string().valid('generic', 'managed').required(),
    })
  ),
  ios: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      workflow: Joi.string().valid('generic', 'managed').required(),
    })
  ),
});

const AndroidGenericSchema = Joi.object({
  workflow: Joi.string().valid('generic').required(),
  keystorePath: Joi.string().required(),
  buildCommand: Joi.string(),
  artifactPath: Joi.string(),
});

const AndroidManagedSchema = Joi.object({
  workflow: Joi.string().valid('managed').required(),
  buildType: Joi.string(),
});

const iOSGenericSchema = Joi.object({
  workflow: Joi.string().valid('generic').required(),
});
const iOSManagedSchema = Joi.object({
  workflow: Joi.string().valid('managed').required(),
  buildType: Joi.string(),
});

const schemaPresetMap: Record<string, Record<string, Joi.Schema>> = {
  android: {
    generic: AndroidGenericSchema,
    managed: AndroidManagedSchema,
  },
  ios: {
    managed: iOSManagedSchema,
    generic: iOSGenericSchema,
  },
};

interface Options {
  platform: 'android' | 'ios' | 'all';
}

export class EasJsonReader {
  constructor(private projectDir: string, private options: Options) {}

  public async read(presetName: string): Promise<EasConfig> {
    const easJson = await this.readFile();

    let androidConfig = this.validatePreset<AndroidPreset>(
      Platform.Android,
      presetName,
      easJson.android?.[presetName]
    );
    let iosConfig = this.validatePreset<iOSPreset>(
      Platform.iOS,
      presetName,
      easJson.ios?.[presetName]
    );
    return {
      credentialsSource: easJson.credentialsSource ?? CredentialsSource.AUTO,
      android: androidConfig,
      ios: iosConfig,
    };
  }

  private validatePreset<T>(platform: string, presetName: string, preset?: any): T {
    if (!preset) {
      throw new Error(`There is no preset named ${presetName} for ${platform}`);
    }
    const schema = schemaPresetMap['android'][preset?.workflow];
    if (!schema) {
      throw new Error('invalid workflow'); // this should be validated earlier
    }
    const { value, error } = schema.validate(preset, {
      stripUnknown: true,
      convert: true,
      abortEarly: false,
    });

    if (error) {
      throw new Error(
        `Object "${platform}.${presetName}" in eas.json is not valid [${error.toString()}]`
      );
    }
    return value;
  }

  private async readFile(): Promise<EasJson> {
    const rawFile = await fs.readFile(path.join(this.projectDir, 'eas.json'), 'utf-8');
    const json = JSON.parse(rawFile);

    const { value, error } = EasJsonSchema.validate(json, {
      abortEarly: false,
    });

    if (error) {
      throw new Error(`eas.json is not valid [${error.toString()}]`);
    }
    return value;
  }
}
