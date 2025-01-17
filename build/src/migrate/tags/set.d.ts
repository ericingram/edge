import lodash from '@poppinss/utils/lodash';
import { TagContract } from '../../types.js';
declare module '../../template.js' {
    interface Template {
        setValue: (typeof lodash)['set'];
    }
}
/**
 * The set tag is used to set runtime values within the template. The value
 * is set inside the current scope of the template.
 *
 * ```edge
 * @set('user.username', 'virk')
 * <p> {{ user.username }} </p>
 * ```
 *
 * Set it inside the each loop.
 *
 * ```edge
 * @each(user in users)
 *   @set('age', user.age + 1)
 *   {{ age }}
 * @endeach
 * ```
 */
export declare const setTag: TagContract;
