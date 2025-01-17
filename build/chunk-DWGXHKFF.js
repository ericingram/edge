var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/template.ts
import he from "he";
import { EdgeError as EdgeError2 } from "edge-error";
import lodash3 from "@poppinss/utils/lodash";
import Macroable from "@poppinss/macroable";

// src/migrate/props.ts
import lodash2 from "@poppinss/utils/lodash";
import stringifyAttributes2 from "stringify-attributes";

// src/component/props.ts
import lodash from "@poppinss/utils/lodash";

// src/utils.ts
import classNames from "classnames";
import { EdgeError } from "edge-error";
import { find, html } from "property-information";
function definePropertyInformation(property, value) {
  html.normal[property] = property;
  html.property[property] = {
    attribute: property,
    boolean: true,
    property,
    space: "html",
    booleanish: false,
    commaOrSpaceSeparated: false,
    commaSeparated: false,
    spaceSeparated: false,
    number: false,
    overloadedBoolean: false,
    defined: false,
    mustUseProperty: false,
    ...value
  };
}
definePropertyInformation("x-cloak");
definePropertyInformation("x-ignore");
definePropertyInformation("x-transition:enterstart", {
  attribute: "x-transition:enter-start",
  property: "x-transition:enterStart",
  boolean: false,
  spaceSeparated: true,
  commaOrSpaceSeparated: true
});
definePropertyInformation("x-transition:enterend", {
  attribute: "x-transition:enter-end",
  property: "x-transition:enterEnd",
  boolean: false,
  spaceSeparated: true,
  commaOrSpaceSeparated: true
});
definePropertyInformation("x-transition:leavestart", {
  attribute: "x-transition:leave-start",
  property: "x-transition:leaveStart",
  boolean: false,
  spaceSeparated: true,
  commaOrSpaceSeparated: true
});
definePropertyInformation("x-transition:leaveend", {
  attribute: "x-transition:leave-end",
  property: "x-transition:leaveEnd",
  boolean: false,
  spaceSeparated: true,
  commaOrSpaceSeparated: true
});
var alpineNamespaces = {
  x: "x-",
  xOn: "x-on:",
  xBind: "x-bind:",
  xTransition: "x-transition:"
};
function unallowedExpression(message, filename, loc) {
  throw new EdgeError(message, "E_UNALLOWED_EXPRESSION", {
    line: loc.line,
    col: loc.col,
    filename
  });
}
function isSubsetOf(expression, expressions, errorCallback) {
  if (!expressions.includes(expression.type)) {
    errorCallback();
  }
}
function isNotSubsetOf(expression, expressions, errorCallback) {
  if (expressions.includes(expression.type)) {
    errorCallback();
  }
}
function parseJsArg(parser, token) {
  return parser.utils.transformAst(
    parser.utils.generateAST(token.properties.jsArg, token.loc, token.filename),
    token.filename,
    parser
  );
}
function each(collection, iteratee) {
  if (Array.isArray(collection)) {
    for (let [key, value] of collection.entries()) {
      iteratee(value, key);
    }
    return;
  }
  if (typeof collection === "string") {
    let index = 0;
    for (let value of collection) {
      iteratee(value, index++);
    }
    return;
  }
  if (collection && typeof collection === "object") {
    for (let [key, value] of Object.entries(collection)) {
      iteratee(value, key);
    }
  }
}
async function asyncEach(collection, iteratee) {
  if (Array.isArray(collection)) {
    for (let [key, value] of collection.entries()) {
      await iteratee(value, key);
    }
    return;
  }
  if (typeof collection === "string") {
    let index = 0;
    for (let value of collection) {
      await iteratee(value, index++);
    }
    return;
  }
  if (collection && typeof collection === "object") {
    for (let [key, value] of Object.entries(collection)) {
      await iteratee(value, key);
    }
  }
}
var StringifiedObject = class {
  #obj = "";
  addSpread(key) {
    this.#obj += this.#obj.length ? `, ${key}` : `${key}`;
  }
  /**
   * Add key/value pair to the object.
   *
   * ```js
   * stringifiedObject.add('username', `'virk'`)
   * ```
   */
  add(key, value, isComputed = false) {
    key = isComputed ? `[${key}]` : key;
    this.#obj += this.#obj.length ? `, ${key}: ${value}` : `${key}: ${value}`;
  }
  /**
   * Returns the object alike string back.
   *
   * ```js
   * stringifiedObject.flush()
   *
   * // returns
   * `{ username: 'virk' }`
   * ```
   */
  flush() {
    const obj = `{ ${this.#obj} }`;
    this.#obj = "";
    return obj;
  }
};
function stringifyAttributes(props, namespace) {
  const attributes = Object.keys(props);
  if (attributes.length === 0) {
    return "";
  }
  return attributes.reduce((result, key) => {
    let value = props[key];
    key = namespace ? `${namespace}${key}` : key;
    if (!value) {
      return result;
    }
    if (alpineNamespaces[key] && typeof value === "object") {
      result = result.concat(stringifyAttributes(value, alpineNamespaces[key]));
      return result;
    }
    const propInfo = find(html, key);
    if (!propInfo) {
      return result;
    }
    const attribute = propInfo.attribute;
    if (value === true) {
      result.push(attribute);
      return result;
    }
    if (key === "class") {
      value = `"${classNames(value)}"`;
    } else if (Array.isArray(value)) {
      value = `"${value.join(propInfo.commaSeparated ? "," : " ")}"`;
    } else {
      value = `"${String(value)}"`;
    }
    result.push(`${attribute}=${value}`);
    return result;
  }, []).join(" ");
}

// src/component/props.ts
var ComponentProps = class _ComponentProps {
  #values;
  constructor(values) {
    this.#values = values;
    Object.assign(this, values);
  }
  /**
   * Create a typed instance of Component props with properties
   */
  static create(values) {
    return new _ComponentProps(values);
  }
  /**
   * Reference to props raw values
   */
  all() {
    return this.#values;
  }
  /**
   * Check if a key exists
   */
  has(key) {
    return lodash.has(this.#values, key);
  }
  /**
   * Get key value
   */
  get(key, defaultValue) {
    return lodash.get(this.#values, key, defaultValue);
  }
  /**
   * Returns a new props bag with only the mentioned keys
   */
  only(keys) {
    return new _ComponentProps(lodash.pick(this.#values, keys));
  }
  /**
   * Returns a new props bag with except the mentioned keys
   */
  except(keys) {
    return new _ComponentProps(lodash.omit(this.#values, keys));
  }
  /**
   * Merge defaults with the props
   *
   * - All other attributes will be overwritten when defined in props
   * - Classes will be merged together.
   */
  merge(values) {
    if (values.class && this.#values["class"]) {
      const classesSet = /* @__PURE__ */ new Set();
      (Array.isArray(values.class) ? values.class : [values]).forEach((item) => {
        classesSet.add(item);
      });
      (Array.isArray(this.#values["class"]) ? this.#values["class"] : [this.#values["class"]]).forEach((item) => {
        classesSet.add(item);
      });
      return new _ComponentProps({ ...values, ...this.#values, class: Array.from(classesSet) });
    }
    return new _ComponentProps({ ...values, ...this.#values });
  }
  /**
   * Merge defaults with the props, if the given condition is truthy
   */
  mergeIf(conditional, values) {
    if (conditional) {
      return this.merge(values);
    }
    return this;
  }
  /**
   * Merge defaults with the props, if the given condition is falsy
   */
  mergeUnless(conditional, values) {
    if (!conditional) {
      return this.merge(values);
    }
    return this;
  }
  /**
   * Converts props to HTML attributes
   */
  toAttrs() {
    return htmlSafe(stringifyAttributes(this.#values));
  }
};

// src/migrate/props.ts
var Props = class {
  constructor(props) {
    this[Symbol.for("options")] = { props };
    Object.assign(this, props);
    this.next = new ComponentProps(props);
  }
  /**
   * Merges the className attribute with the class attribute
   */
  #mergeClassAttributes(props) {
    if (props.className) {
      if (!props.class) {
        props.class = [];
      }
      if (!Array.isArray(props.class)) {
        props.class = [props.class];
      }
      props.class = props.class.concat(props.className);
      props.className = false;
    }
    return props;
  }
  /**
   * Find if a key exists inside the props
   */
  has(key) {
    const value = this.get(key);
    return value !== void 0 && value !== null;
  }
  /**
   * Get value for a given key
   */
  get(key, defaultValue) {
    return lodash2.get(this.all(), key, defaultValue);
  }
  /**
   * Returns all the props
   */
  all() {
    return this[Symbol.for("options")].props;
  }
  /**
   * Validate prop value
   */
  validate(key, validateFn) {
    const value = this.get(key);
    validateFn(key, value);
  }
  /**
   * Return values for only the given keys
   */
  only(keys) {
    return lodash2.pick(this.all(), keys);
  }
  /**
   * Return values except the given keys
   */
  except(keys) {
    return lodash2.omit(this.all(), keys);
  }
  /**
   * Serialize all props to a string of HTML attributes
   */
  serialize(mergeProps, prioritizeInline = true) {
    const attributes = prioritizeInline ? lodash2.merge({}, this.all(), mergeProps) : lodash2.merge({}, mergeProps, this.all());
    return htmlSafe(stringifyAttributes2(this.#mergeClassAttributes(attributes)));
  }
  /**
   * Serialize only the given keys to a string of HTML attributes
   */
  serializeOnly(keys, mergeProps, prioritizeInline = true) {
    const attributes = prioritizeInline ? lodash2.merge({}, this.only(keys), mergeProps) : lodash2.merge({}, mergeProps, this.only(keys));
    return htmlSafe(stringifyAttributes2(this.#mergeClassAttributes(attributes)));
  }
  /**
   * Serialize except the given keys to a string of HTML attributes
   */
  serializeExcept(keys, mergeProps, prioritizeInline = true) {
    const attributes = prioritizeInline ? lodash2.merge({}, this.except(keys), mergeProps) : lodash2.merge({}, mergeProps, this.except(keys));
    return htmlSafe(stringifyAttributes2(this.#mergeClassAttributes(attributes)));
  }
};

// src/template.ts
var SafeValue = class {
  constructor(value) {
    this.value = value;
  }
};
function escape(input) {
  return input instanceof SafeValue ? input.value : he.escape(String(input));
}
function htmlSafe(value) {
  return new SafeValue(value);
}
var Template = class extends Macroable {
  #compiler;
  #processor;
  /**
   * The shared state is used to hold the globals and locals,
   * since it is shared with components too.
   */
  #sharedState;
  constructor(compiler, globals, locals, processor) {
    super();
    this.#compiler = compiler;
    this.#processor = processor;
    this.#sharedState = compiler.compat ? lodash3.merge({}, globals, locals) : {
      ...globals,
      ...locals
    };
  }
  /**
   * Trims top and bottom new lines from the content
   */
  #trimTopBottomNewLines(value) {
    return value.replace(/^\n|^\r\n/, "").replace(/\n$|\r\n$/, "");
  }
  /**
   * Render a compiled template with state
   */
  #renderCompiled(compiledTemplate, state) {
    const templateState = { ...this.#sharedState, ...state };
    const $context = {};
    if (this.#compiler.async) {
      return compiledTemplate(this, templateState, $context).then((output2) => {
        output2 = this.#trimTopBottomNewLines(output2);
        return this.#processor.executeOutput({ output: output2, template: this, state: templateState });
      });
    }
    const output = this.#trimTopBottomNewLines(compiledTemplate(this, templateState, $context));
    return this.#processor.executeOutput({ output, template: this, state: templateState });
  }
  /**
   * Render a partial
   *
   * ```js
   * const partialFn = template.compilePartial('includes/user')
   *
   * // render and use output
   * partialFn(template, state, ctx)
   * ```
   */
  compilePartial(templatePath, ...localVariables) {
    return this.#compiler.compile(templatePath, localVariables);
  }
  /**
   * Render a component
   *
   * ```js
   * const componentFn = template.compileComponent('components/button')
   *
   * // render and use output
   * componentFn(template, template.getComponentState(props, slots, caller), ctx)
   * ```
   */
  compileComponent(templatePath) {
    return this.#compiler.compile(templatePath);
  }
  /**
   * Returns the isolated state for a given component
   */
  getComponentState(props, slots, caller) {
    return {
      ...this.#sharedState,
      ...props,
      $slots: slots,
      $caller: caller,
      $props: this.#compiler.compat ? new Props(props) : new ComponentProps(props)
    };
  }
  /**
   * Render a template with it's state.
   *
   * ```js
   * template.render('welcome', { key: 'value' })
   * ```
   */
  render(template, state) {
    let compiledTemplate = this.#compiler.compile(template);
    return this.#renderCompiled(compiledTemplate, state);
  }
  /**
   * Render template from a raw string
   *
   * ```js
   * template.renderRaw('Hello {{ username }}', { username: 'virk' })
   * ```
   */
  renderRaw(contents, state, templatePath) {
    let compiledTemplate = this.#compiler.compileRaw(contents, templatePath);
    return this.#renderCompiled(compiledTemplate, state);
  }
  /**
   * Escapes the value to be HTML safe. Only strings are escaped
   * and rest all values will be returned as it is.
   */
  escape(input) {
    return escape(input);
  }
  /**
   * Raise an error
   */
  newError(errorMessage, filename, lineNumber, column) {
    throw new EdgeError2(errorMessage, "E_RUNTIME_EXCEPTION", {
      filename,
      line: lineNumber,
      col: column
    });
  }
  /**
   * Rethrows the runtime exception by re-constructing the error message
   * to point back to the original filename
   */
  reThrow(error, filename, lineNumber) {
    if (error instanceof EdgeError2) {
      throw error;
    }
    const message = error.message.replace(/state\./, "");
    throw new EdgeError2(message, "E_RUNTIME_EXCEPTION", {
      filename,
      line: lineNumber,
      col: 0
    });
  }
};

export {
  __export,
  unallowedExpression,
  isSubsetOf,
  isNotSubsetOf,
  parseJsArg,
  each,
  asyncEach,
  StringifiedObject,
  stringifyAttributes,
  escape,
  htmlSafe,
  Template
};
//# sourceMappingURL=chunk-DWGXHKFF.js.map