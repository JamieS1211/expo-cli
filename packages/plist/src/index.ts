import { XMLToStringOptions } from 'xmlbuilder';
import { parse } from './parse';
import { build } from './build';

// PlistValue
export type PlistValue = string | number | boolean | Date | Buffer | PlistObject | PlistArray;
export interface PlistObject {
  readonly [x: string]: PlistValue;
}
export interface PlistArray extends ReadonlyArray<PlistValue> {}

// PlistBuildOptions
// The instance of this type is passed to 'xmlbuilder' module as it is.
export type PlistBuildOptions = XMLToStringOptions;

export default { parse, build };
