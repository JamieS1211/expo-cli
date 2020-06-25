import path from 'path';

import Joi from '@hapi/joi';
import fs from 'fs-extra';

interface CredentialsJson {
  android: {
    keystore: AndroidCredentials;
  };
  ios: iOSCredentials;
}

interface AndroidCredentials {
  keystorePath: string;
  keystorePassword: string;
  keyAlias: string;
  keyPassword: string;
}

interface iOSCredentials {
  provisioningProfilePath: string;
  distributionCertificate: {
    path: string;
    password: string;
  };
}

const AndroidCredentialsSchema = Joi.object({
  keystorePath: Joi.string().required(),
  keystorePassword: Joi.string().required(),
  keyAlias: Joi.string().required(),
  keyPassword: Joi.string().required(),
});

const iOSCredentialsSchema = Joi.object({
  provisioningProfilePath: Joi.string().required(),
  distributionCertificate: Joi.object({
    path: Joi.string().required(),
    password: Joi.string().required(),
  }).required(),
});

const CredentialsJsonSchema = Joi.object({
  android: AndroidCredentialsSchema,
  ios: iOSCredentialsSchema,
});

async function exists(projectDir: string): Promise<boolean> {
  return await fs.pathExists(path.join(projectDir, 'credentials.json'));
}

async function read(projectDir: string): Promise<CredentialsJson> {
  const credentialsJsonFilePath = path.join(projectDir, 'credentials.json');
  let turtleJSONRaw;
  try {
    const turtleJSONContents = await fs.readFile(credentialsJsonFilePath, 'utf8');
    turtleJSONRaw = JSON.parse(turtleJSONContents);
  } catch (err) {
    throw new Error(
      `credntials.json must exist in the project root directory and consist a valid json`
    );
  }

  const { value: credentialsJson, error } = CredentialsJsonSchema.validate(turtleJSONRaw, {
    stripUnknown: true,
    convert: true,
    abortEarly: false,
  });
  if (error) {
    throw new Error(`credentials.json is not valid [${error.toString()}]`);
  }

  return credentialsJson;
}

export default { read, exists };
