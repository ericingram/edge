import {
  StringifiedObject,
  Template,
  __export,
  asyncEach,
  each,
  escape,
  htmlSafe,
  isNotSubsetOf,
  isSubsetOf,
  parseJsArg,
  stringifyAttributes,
  unallowedExpression
} from "./chunk-DWGXHKFF.js";

// src/loader.ts
import { slash } from "@poppinss/utils";
import string from "@poppinss/utils/string";
import { join, isAbsolute } from "node:path";
var Loader = class {
  /**
   * List of mounted directories
   */
  #mountedDirs = /* @__PURE__ */ new Map();
  /**
   * List of pre-registered (in-memory) templates
   */
  #preRegistered = /* @__PURE__ */ new Map();
  /**
   * Reads the content of a template from the disk. An exception is raised
   * when file is missing or if `readFileSync` returns an error.
   */
  #readTemplateContents(_absPath) {
    return "";
  }
  /**
   * Returns a list of components for a given disk
   */
  #getDiskComponents(diskName) {
    let files = diskName === "default" ? Array.from(this.#preRegistered.keys()).map((template) => {
      return {
        fileName: template,
        componentPath: template
      };
    }) : [];
    return files.map(({ fileName, componentPath }) => {
      const tagName = fileName.split("/").filter((segment, index) => {
        return index === 0 || segment !== "index";
      }).map((segment) => string.camelCase(segment)).join(".");
      return {
        componentName: diskName !== "default" ? `${diskName}::${componentPath}` : componentPath,
        tagName: diskName !== "default" ? `${diskName}.${tagName}` : tagName
      };
    });
  }
  /**
   * Returns a list of templates for a given disk
   */
  #getDiskTemplates(diskName) {
    let files = diskName === "default" ? Array.from(this.#preRegistered.keys()) : [];
    return files.map((file) => {
      const fileName = slash(file).replace(/\.edge$/, "");
      return diskName !== "default" ? `${diskName}::${fileName}` : fileName;
    });
  }
  /**
   * Extracts the disk name and the template name from the template
   * path expression.
   *
   * If `diskName` is missing, it will be set to `default`.
   *
   * ```
   * extractDiskAndTemplateName('users::list')
   * // returns ['users', 'list.edge']
   *
   * extractDiskAndTemplateName('list')
   * // returns ['default', 'list.edge']
   * ```
   */
  #extractDiskAndTemplateName(templatePath) {
    let [disk, ...rest] = templatePath.split("::");
    if (!rest.length) {
      rest = [disk];
      disk = "default";
    }
    let [template, ext] = rest.join("::").split(".edge");
    return [disk, `${template}.${ext || "edge"}`];
  }
  /**
   * Returns an object of mounted directories with their public
   * names.
   *
   * ```js
   * loader.mounted
   * // output
   *
   * {
   *   default: '/users/virk/code/app/views',
   *   foo: '/users/virk/code/app/foo',
   * }
   * ```
   */
  get mounted() {
    return Array.from(this.#mountedDirs).reduce(
      (obj, [key, value]) => {
        obj[key] = value;
        return obj;
      },
      {}
    );
  }
  /**
   * Returns an object of templates registered as a raw string
   *
   * ```js
   * loader.templates
   * // output
   *
   * {
   *   'form.label': { template: 'Template contents' }
   * }
   * ```
   */
  get templates() {
    return Array.from(this.#preRegistered).reduce(
      (obj, [key, value]) => {
        obj[key] = value;
        return obj;
      },
      {}
    );
  }
  /**
   * Mount a directory with a name for resolving views. If name is set
   * to `default`, then you can resolve views without prefixing the
   * disk name.
   *
   * ```js
   * loader.mount('default', join(__dirname, 'views'))
   *
   * // mount a named disk
   * loader.mount('admin', join(__dirname, 'admin/views'))
   * ```
   */
  mount(diskName, dirPath) {
    this.#mountedDirs.set(
      diskName,
      String(dirPath)
      /*typeof dirPath === 'string' ? dirPath : fileURLToPath(dirPath)*/
    );
  }
  /**
   * Remove the previously mounted dir.
   *
   * ```js
   * loader.unmount('default')
   * ```
   */
  unmount(diskName) {
    this.#mountedDirs.delete(diskName);
  }
  /**
   * Make path to a given template. The paths are resolved from the root
   * of the mounted directory.
   *
   * ```js
   * loader.makePath('welcome') // returns {diskRootPath}/welcome.edge
   * loader.makePath('admin::welcome') // returns {adminRootPath}/welcome.edge
   * loader.makePath('users.list') // returns {diskRootPath}/users/list.edge
   * ```
   *
   * @throws Error if disk is not mounted and attempting to make path for it.
   */
  makePath(templatePath) {
    if (this.#preRegistered.has(templatePath)) {
      return templatePath;
    }
    if (isAbsolute(templatePath)) {
      return templatePath;
    }
    const [diskName, template] = this.#extractDiskAndTemplateName(templatePath);
    const mountedDir = this.#mountedDirs.get(diskName);
    if (!mountedDir) {
      throw new Error(`"${diskName}" namespace is not mounted`);
    }
    return join(mountedDir, template);
  }
  /**
   * Resolves the template by reading its contents from the disk
   *
   * ```js
   * loader.resolve('welcome', true)
   *
   * // output
   * {
   *   template: `<h1> Template content </h1>`,
   * }
   * ```
   */
  resolve(templatePath) {
    if (this.#preRegistered.has(templatePath)) {
      return this.#preRegistered.get(templatePath);
    }
    templatePath = isAbsolute(templatePath) ? templatePath : this.makePath(templatePath);
    return {
      template: this.#readTemplateContents(templatePath)
    };
  }
  /**
   * Register in memory template for a given path. This is super helpful
   * when distributing components.
   *
   * ```js
   * loader.register('welcome', {
   *   template: '<h1> Template content </h1>',
   *   Presenter: class Presenter {
   *     constructor (state) {
   *       this.state = state
   *     }
   *   }
   * })
   * ```
   *
   * @throws Error if template content is empty.
   */
  register(templatePath, contents) {
    if (typeof contents.template !== "string") {
      throw new Error("Make sure to define the template content as a string");
    }
    if (this.#preRegistered.has(templatePath)) {
      throw new Error(`Cannot override previously registered "${templatePath}" template`);
    }
    this.#preRegistered.set(templatePath, contents);
  }
  /**
   * Remove registered template
   */
  remove(templatePath) {
    this.#preRegistered.delete(templatePath);
  }
  /**
   * Returns a list of components from all the disks. We assume
   * the components are stored within the components directory.
   *
   * Also, we treat all in-memory templates as components.
   *
   * The return path is same the path you will pass to the `@component`
   * tag.
   */
  listComponents() {
    const diskNames = [...this.#mountedDirs.keys()];
    return diskNames.map((diskName) => {
      return {
        diskName,
        components: this.#getDiskComponents(diskName)
      };
    });
  }
  /**
   * Returns a list of templates from all the disks and in-memory
   * templates as well
   */
  listTemplates() {
    const diskNames = [...this.#mountedDirs.keys()];
    return diskNames.map((diskName) => {
      return {
        diskName,
        templates: this.#getDiskTemplates(diskName)
      };
    });
  }
};

// src/tags/main.ts
var main_exports = {};
__export(main_exports, {
  assign: () => assignTag,
  component: () => componentTag,
  debugger: () => debuggerTag,
  each: () => eachTag,
  else: () => elseTag,
  elseif: () => elseIfTag,
  eval: () => evalTag,
  if: () => ifTag,
  include: () => includeTag,
  includeIf: () => includeIfTag,
  inject: () => injectTag,
  let: () => letTag,
  newError: () => newErrorTag,
  slot: () => slotTag,
  unless: () => unlessTag
});

// src/tags/if.ts
import { expressions } from "edge-parser";
var ifTag = {
  block: true,
  seekable: true,
  tagName: "if",
  /**
   * Compiles the if block node to a Javascript if statement
   */
  compile(parser, buffer, token) {
    const parsed = parseJsArg(parser, token);
    isNotSubsetOf(parsed, [expressions.SequenceExpression], () => {
      unallowedExpression(
        `"${token.properties.jsArg}" is not a valid argument type for the @if tag`,
        token.filename,
        parser.utils.getExpressionLoc(parsed)
      );
    });
    buffer.writeStatement(
      `if (${parser.utils.stringify(parsed)}) {`,
      token.filename,
      token.loc.start.line
    );
    token.children.forEach((child) => parser.processToken(child, buffer));
    buffer.writeStatement("}", token.filename, -1);
  }
};

// src/tags/let.ts
import { expressions as expressions2 } from "edge-parser";
import lodash from "@poppinss/utils/lodash";
var letTag = {
  block: false,
  seekable: true,
  tagName: "let",
  noNewLine: true,
  /**
   * Compiles else block node to Javascript else statement
   */
  compile(parser, buffer, token) {
    const parsed = parser.utils.generateAST(
      `let ${token.properties.jsArg}`,
      token.loc,
      token.filename
    ).declarations[0];
    const key = parsed.id;
    const value = parsed.init;
    isSubsetOf(key, ["ObjectPattern", expressions2.Identifier, "ArrayPattern"], () => {
      throw unallowedExpression(
        `Invalid variable name for the @let tag`,
        token.filename,
        parser.utils.getExpressionLoc(key)
      );
    });
    if (key.type === "Identifier") {
      parser.stack.defineVariable(key.name);
    } else if (key.type === "ObjectPattern") {
      key.properties.forEach((property) => {
        parser.stack.defineVariable(
          property.argument ? property.argument.name : property.value.name
        );
      });
    } else if (key.type === "ArrayPattern") {
      key.elements.forEach((element) => {
        parser.stack.defineVariable(element.argument ? element.argument.name : element.name);
      });
    }
    const expression = `let ${parser.utils.stringify(key)} = ${parser.utils.stringify(
      parser.utils.transformAst(value, token.filename, parser)
    )}`;
    buffer.writeExpression(expression, token.filename, token.loc.start.line);
  },
  /**
   * Add methods to the template for running the loop
   */
  boot(template) {
    template.macro("setValue", lodash.set);
  }
};

// src/tags/each.ts
import lodash2 from "@poppinss/utils/lodash";
import * as lexerUtils from "edge-lexer/utils";
import { expressions as expressions3 } from "edge-parser";
function getLoopList(rhsExpression, parser, filename) {
  return parser.utils.stringify(parser.utils.transformAst(rhsExpression, filename, parser));
}
function getLoopItemAndIndex(lhsExpression, parser, filename) {
  isSubsetOf(lhsExpression, [expressions3.SequenceExpression, expressions3.Identifier], () => {
    unallowedExpression(
      `invalid left hand side "${lhsExpression.type}" expression for the @each tag`,
      filename,
      parser.utils.getExpressionLoc(lhsExpression)
    );
  });
  if (lhsExpression.type === "SequenceExpression") {
    isSubsetOf(lhsExpression.expressions[0], [expressions3.Identifier], () => {
      unallowedExpression(
        `"${lhsExpression.expressions[0]}.type" is not allowed as value identifier for @each tag`,
        filename,
        parser.utils.getExpressionLoc(lhsExpression.expressions[0])
      );
    });
    isSubsetOf(lhsExpression.expressions[1], [expressions3.Identifier], () => {
      unallowedExpression(
        `"${lhsExpression.expressions[1]}.type" is not allowed as key identifier for @each tag`,
        filename,
        parser.utils.getExpressionLoc(lhsExpression.expressions[1])
      );
    });
    return [lhsExpression.expressions[0].name, lhsExpression.expressions[1].name];
  }
  return [lhsExpression.name];
}
var eachTag = {
  block: true,
  seekable: true,
  tagName: "each",
  /**
   * Compile the template
   */
  compile(parser, buffer, token) {
    const awaitKeyword = parser.asyncMode ? "await " : "";
    const loopFunctionName = parser.asyncMode ? "loopAsync" : "loop";
    const asyncKeyword = parser.asyncMode ? "async " : "";
    const { expression } = parser.utils.generateAST(
      token.properties.jsArg,
      token.loc,
      token.filename
    );
    isSubsetOf(expression, [expressions3.BinaryExpression], () => {
      unallowedExpression(
        `"${token.properties.jsArg}" is not valid expression for the @each tag`,
        token.filename,
        parser.utils.getExpressionLoc(expression)
      );
    });
    const elseIndex = token.children.findIndex((child) => lexerUtils.isTag(child, "else"));
    const elseChildren = elseIndex > -1 ? token.children.splice(elseIndex) : [];
    const list = getLoopList(expression.right, parser, token.filename);
    const [item, index] = getLoopItemAndIndex(expression.left, parser, token.filename);
    if (elseIndex > -1) {
      buffer.writeStatement(`if(template.size(${list})) {`, token.filename, token.loc.start.line);
    }
    const loopCallbackArgs = (index ? [item, index] : [item]).join(",");
    buffer.writeStatement(
      `${awaitKeyword}template.${loopFunctionName}(${list}, ${asyncKeyword}function (${loopCallbackArgs}) {`,
      token.filename,
      token.loc.start.line
    );
    parser.stack.defineScope();
    parser.stack.defineVariable(item);
    index && parser.stack.defineVariable(index);
    token.children.forEach((child) => parser.processToken(child, buffer));
    parser.stack.clearScope();
    buffer.writeExpression("})", token.filename, -1);
    if (elseIndex > -1) {
      elseChildren.forEach((elseChild) => parser.processToken(elseChild, buffer));
      buffer.writeStatement("}", token.filename, -1);
    }
  },
  /**
   * Add methods to the template for running the loop
   */
  boot(template) {
    template.macro("loopAsync", asyncEach);
    template.macro("loop", each);
    template.macro("size", lodash2.size);
  }
};

// src/tags/slot.ts
import { EdgeError } from "edge-error";
var slotTag = {
  block: true,
  seekable: true,
  tagName: "slot",
  noNewLine: true,
  compile(_, __, token) {
    throw new EdgeError(
      "@slot tag must appear as top level tag inside the @component tag",
      "E_ORPHAN_SLOT_TAG",
      {
        line: token.loc.start.line,
        col: token.loc.start.col,
        filename: token.filename
      }
    );
  }
};

// src/tags/else.ts
var elseTag = {
  block: false,
  seekable: false,
  tagName: "else",
  /**
   * Compiles else block node to Javascript else statement
   */
  compile(_, buffer, token) {
    buffer.writeStatement("} else {", token.filename, -1);
  }
};

// src/tags/eval.ts
var evalTag = {
  block: false,
  seekable: true,
  tagName: "eval",
  noNewLine: true,
  /**
   * Compiles the tag AST
   */
  compile(parser, buffer, token) {
    const parsed = parseJsArg(parser, token);
    buffer.writeExpression(parser.utils.stringify(parsed), token.filename, token.loc.start.line);
  }
};

// src/tags/assign.ts
import { expressions as expressions4 } from "edge-parser";
import lodash3 from "@poppinss/utils/lodash";
var assignTag = {
  block: false,
  seekable: true,
  tagName: "assign",
  noNewLine: true,
  /**
   * Compiles else block node to Javascript else statement
   */
  compile(parser, buffer, token) {
    const parsed = parseJsArg(parser, token);
    isSubsetOf(parsed, [expressions4.AssignmentExpression], () => {
      throw unallowedExpression(
        `Invalid expression for the @assign tag`,
        token.filename,
        parser.utils.getExpressionLoc(parsed)
      );
    });
    buffer.writeExpression(parser.utils.stringify(parsed), token.filename, token.loc.start.line);
  },
  /**
   * Add methods to the template for running the loop
   */
  boot(template) {
    template.macro("setValue", lodash3.set);
  }
};

// src/tags/inject.ts
import { expressions as expressions5 } from "edge-parser";
var injectTag = {
  block: false,
  seekable: true,
  tagName: "inject",
  noNewLine: true,
  compile(parser, buffer, token) {
    token.properties.jsArg = `(${token.properties.jsArg})`;
    const parsed = parseJsArg(parser, token);
    isSubsetOf(
      parsed,
      [expressions5.ObjectExpression, expressions5.Identifier, expressions5.CallExpression],
      () => {
        throw unallowedExpression(
          `"${token.properties.jsArg}" is not a valid key-value pair for the @inject tag`,
          token.filename,
          parser.utils.getExpressionLoc(parsed)
        );
      }
    );
    buffer.writeStatement(
      "if (!state.$slots || !state.$slots.$context) {",
      token.filename,
      token.loc.start.line
    );
    buffer.writeExpression(
      `throw new Error('Cannot use "@inject" outside of a component scope')`,
      token.filename,
      token.loc.start.line
    );
    buffer.writeStatement("}", token.filename, token.loc.start.line);
    buffer.writeExpression(
      `Object.assign(state.$slots.$context, ${parser.utils.stringify(parsed)})`,
      token.filename,
      token.loc.start.line
    );
  }
};

// src/tags/unless.ts
import { expressions as expressions6 } from "edge-parser";
var unlessTag = {
  block: true,
  seekable: true,
  tagName: "unless",
  /**
   * Compiles the if block node to a Javascript if statement
   */
  compile(parser, buffer, token) {
    const parsed = parseJsArg(parser, token);
    isNotSubsetOf(parsed, [expressions6.SequenceExpression], () => {
      unallowedExpression(
        `"${token.properties.jsArg}" is not a valid argument type for the @unless tag`,
        token.filename,
        parser.utils.getExpressionLoc(parsed)
      );
    });
    buffer.writeStatement(
      `if (!${parser.utils.stringify(parsed)}) {`,
      token.filename,
      token.loc.start.line
    );
    token.children.forEach((child) => parser.processToken(child, buffer));
    buffer.writeStatement("}", token.filename, -1);
  }
};

// src/tags/else_if.ts
import { expressions as expressions7 } from "edge-parser";
var elseIfTag = {
  block: false,
  seekable: true,
  tagName: "elseif",
  /**
   * Compiles the else if block node to a Javascript if statement
   */
  compile(parser, buffer, token) {
    const parsed = parseJsArg(parser, token);
    isNotSubsetOf(parsed, [expressions7.SequenceExpression], () => {
      unallowedExpression(
        `{${token.properties.jsArg}} is not a valid argument type for the @elseif tag`,
        token.filename,
        parser.utils.getExpressionLoc(parsed)
      );
    });
    buffer.writeStatement(
      `} else if (${parser.utils.stringify(parsed)}) {`,
      token.filename,
      token.loc.start.line
    );
  }
};

// src/tags/include.ts
import { expressions as expressions8 } from "edge-parser";
var ALLOWED_EXPRESSION = [
  expressions8.Literal,
  expressions8.Identifier,
  expressions8.CallExpression,
  expressions8.TemplateLiteral,
  expressions8.MemberExpression,
  expressions8.LogicalExpression,
  expressions8.ConditionalExpression
];
function getRenderExpression(parser, parsedExpression) {
  const localVariables = parser.stack.list();
  const renderArgs = localVariables.length ? [
    parser.utils.stringify(parsedExpression),
    localVariables.map((localVar) => `"${localVar}"`).join(",")
  ] : [parser.utils.stringify(parsedExpression)];
  const callFnArgs = localVariables.length ? ["template", "state", "$context", localVariables.map((localVar) => localVar).join(",")] : ["template", "state", "$context"];
  return `template.compilePartial(${renderArgs.join(",")})(${callFnArgs.join(",")})`;
}
var includeTag = {
  block: false,
  seekable: true,
  tagName: "include",
  /**
   * Compiles else block node to Javascript else statement
   */
  compile(parser, buffer, token) {
    const awaitKeyword = parser.asyncMode ? "await " : "";
    const parsed = parseJsArg(parser, token);
    isSubsetOf(parsed, ALLOWED_EXPRESSION, () => {
      unallowedExpression(
        `"${token.properties.jsArg}" is not a valid argument type for the @include tag`,
        token.filename,
        parser.utils.getExpressionLoc(parsed)
      );
    });
    buffer.outputExpression(
      `${awaitKeyword}${getRenderExpression(parser, parsed)}`,
      token.filename,
      token.loc.start.line,
      false
    );
  }
};

// src/tags/debugger.ts
var debuggerTag = {
  block: false,
  seekable: false,
  tagName: "debugger",
  noNewLine: true,
  /**
   * Compiles `@debugger` tags
   */
  compile(_, buffer, token) {
    buffer.writeExpression("debugger", token.filename, token.loc.start.line);
  }
};

// src/tags/new_error.ts
import { expressions as expressions9 } from "edge-parser";
var newErrorTag = {
  block: false,
  seekable: true,
  tagName: "newError",
  noNewLine: true,
  compile(parser, buffer, token) {
    const parsed = parseJsArg(parser, token);
    let message = "";
    let line = token.loc.start.line;
    let col = token.loc.start.col;
    let filename = "$filename";
    if (parsed.type === expressions9.SequenceExpression) {
      message = parser.utils.stringify(parsed.expressions[0]);
      filename = parsed.expressions[1] ? parser.utils.stringify(parsed.expressions[1]) : "$filename";
      line = parsed.expressions[2] ? parser.utils.stringify(parsed.expressions[2]) : token.loc.start.line;
      col = parsed.expressions[3] ? parser.utils.stringify(parsed.expressions[3]) : token.loc.start.col;
    } else {
      message = parser.utils.stringify(parsed);
    }
    buffer.writeStatement(
      `template.newError(${message}, ${filename}, ${line}, ${col})`,
      token.filename,
      token.loc.start.line
    );
  }
};

// src/tags/component.ts
import { EdgeError as EdgeError2 } from "edge-error";
import * as lexerUtils2 from "edge-lexer/utils";
import { expressions as expressions10 } from "edge-parser";
var ALLOWED_EXPRESSION_FOR_COMPONENT_NAME = [
  expressions10.Identifier,
  expressions10.Literal,
  expressions10.LogicalExpression,
  expressions10.MemberExpression,
  expressions10.ConditionalExpression,
  expressions10.CallExpression,
  expressions10.TemplateLiteral
];
function getComponentNameAndProps(expression, parser, filename) {
  let name;
  if (expression.type === expressions10.SequenceExpression) {
    name = expression.expressions.shift();
  } else {
    name = expression;
  }
  isSubsetOf(name, ALLOWED_EXPRESSION_FOR_COMPONENT_NAME, () => {
    unallowedExpression(
      `"${parser.utils.stringify(name)}" is not a valid argument for component name`,
      filename,
      parser.utils.getExpressionLoc(name)
    );
  });
  if (expression.type === expressions10.SequenceExpression) {
    const firstSequenceExpression = expression.expressions[0];
    return [parser.utils.stringify(name), parser.utils.stringify(firstSequenceExpression)];
  }
  return [parser.utils.stringify(name), "{}"];
}
function getSlotNameAndProps(token, parser) {
  const parsed = parser.utils.generateAST(
    token.properties.jsArg,
    token.loc,
    token.filename
  ).expression;
  isSubsetOf(parsed, [expressions10.Literal, expressions10.SequenceExpression], () => {
    unallowedExpression(
      `"${token.properties.jsArg}" is not a valid argument type for the @slot tag`,
      token.filename,
      parser.utils.getExpressionLoc(parsed)
    );
  });
  let name;
  if (parsed.type === expressions10.SequenceExpression) {
    name = parsed.expressions[0];
  } else {
    name = parsed;
  }
  isSubsetOf(name, [expressions10.Literal], () => {
    unallowedExpression(
      "slot name must be a valid string literal",
      token.filename,
      parser.utils.getExpressionLoc(name)
    );
  });
  if (parsed.type === expressions10.Literal) {
    return [name.raw, null];
  }
  if (parsed.expressions.length > 2) {
    throw new EdgeError2("maximum of 2 arguments are allowed for @slot tag", "E_MAX_ARGUMENTS", {
      line: parsed.loc.start.line,
      col: parsed.loc.start.column,
      filename: token.filename
    });
  }
  isSubsetOf(parsed.expressions[1], [expressions10.Identifier], () => {
    unallowedExpression(
      `"${parser.utils.stringify(
        parsed.expressions[1]
      )}" is not valid prop identifier for @slot tag`,
      token.filename,
      parser.utils.getExpressionLoc(parsed.expressions[1])
    );
  });
  return [name.raw, parsed.expressions[1].name];
}
var componentTag = {
  block: true,
  seekable: true,
  tagName: "component",
  compile(parser, buffer, token) {
    const asyncKeyword = parser.asyncMode ? "async " : "";
    const awaitKeyword = parser.asyncMode ? "await " : "";
    const parsed = parseJsArg(parser, token);
    isSubsetOf(
      parsed,
      ALLOWED_EXPRESSION_FOR_COMPONENT_NAME.concat(expressions10.SequenceExpression),
      () => {
        unallowedExpression(
          `"${token.properties.jsArg}" is not a valid argument type for the @component tag`,
          token.filename,
          parser.utils.getExpressionLoc(parsed)
        );
      }
    );
    const [name, props] = getComponentNameAndProps(parsed, parser, token.filename);
    const slots = {};
    const mainSlot = {
      outputVar: "slot_main",
      props: {},
      buffer: buffer.create(token.filename, {
        outputVar: "slot_main"
      }),
      line: -1,
      filename: token.filename
    };
    let slotsCounter = 0;
    token.children.forEach((child) => {
      if (!lexerUtils2.isTag(child, "slot")) {
        if (mainSlot.buffer.size === 0 && child.type === "newline") {
          return;
        }
        parser.processToken(child, mainSlot.buffer);
        return;
      }
      const [slotName, slotProps] = getSlotNameAndProps(child, parser);
      slotsCounter++;
      if (!slots[slotName]) {
        slots[slotName] = {
          outputVar: `slot_${slotsCounter}`,
          buffer: buffer.create(token.filename, {
            outputVar: `slot_${slotsCounter}`
          }),
          props: slotProps,
          line: -1,
          filename: token.filename
        };
        if (slotProps) {
          parser.stack.defineScope();
          parser.stack.defineVariable(slotProps);
        }
      }
      child.children.forEach((grandChildren) => {
        parser.processToken(grandChildren, slots[slotName].buffer);
      });
      if (slotProps) {
        parser.stack.clearScope();
      }
    });
    const obj = new StringifiedObject();
    obj.add("$context", "Object.assign({}, $context)");
    if (!slots["main"]) {
      if (mainSlot.buffer.size) {
        mainSlot.buffer.wrap(`${asyncKeyword}function () { const $context = this.$context;`, "}");
        obj.add("main", mainSlot.buffer.disableFileAndLineVariables().flush());
      } else {
        obj.add("main", 'function () { return "" }');
      }
    }
    Object.keys(slots).forEach((slotName) => {
      if (slots[slotName].buffer.size) {
        const fnCall = slots[slotName].props ? `${asyncKeyword}function (${slots[slotName].props}) { const $context = this.$context;` : `${asyncKeyword}function () { const $context = this.$context;`;
        slots[slotName].buffer.wrap(fnCall, "}");
        obj.add(slotName, slots[slotName].buffer.disableFileAndLineVariables().flush());
      } else {
        obj.add(slotName, 'function () { return "" }');
      }
    });
    const caller = new StringifiedObject();
    caller.add("filename", "$filename");
    caller.add("line", "$lineNumber");
    caller.add("col", 0);
    buffer.outputExpression(
      `${awaitKeyword}template.compileComponent(${name})(template, template.getComponentState(${props}, ${obj.flush()}, ${caller.flush()}), $context)`,
      token.filename,
      token.loc.start.line,
      false
    );
  }
};

// src/tags/include_if.ts
import { EdgeError as EdgeError3 } from "edge-error";
import { expressions as expressions11 } from "edge-parser";
var includeIfTag = {
  block: false,
  seekable: true,
  tagName: "includeIf",
  /**
   * Compiles else block node to Javascript else statement
   */
  compile(parser, buffer, token) {
    const awaitKeyword = parser.asyncMode ? "await " : "";
    const parsed = parseJsArg(parser, token);
    isSubsetOf(parsed, [expressions11.SequenceExpression], () => {
      unallowedExpression(
        `"${token.properties.jsArg}" is not a valid argument type for the @includeIf tag`,
        token.filename,
        parser.utils.getExpressionLoc(parsed)
      );
    });
    if (parsed.expressions.length !== 2) {
      throw new EdgeError3("@includeIf expects a total of 2 arguments", "E_ARGUMENTS_MIS_MATCH", {
        line: parsed.loc.start.line,
        col: parsed.loc.start.column,
        filename: token.filename
      });
    }
    const [conditional, include] = parsed.expressions;
    isNotSubsetOf(conditional, [expressions11.SequenceExpression], () => {
      unallowedExpression(
        `"${conditional.type}" is not a valid 1st argument type for the @includeIf tag`,
        token.filename,
        parser.utils.getExpressionLoc(conditional)
      );
    });
    isSubsetOf(include, ALLOWED_EXPRESSION, () => {
      unallowedExpression(
        `"${include.type}" is not a valid 2nd argument type for the @includeIf tag`,
        token.filename,
        parser.utils.getExpressionLoc(include)
      );
    });
    buffer.writeStatement(
      `if (${parser.utils.stringify(conditional)}) {`,
      token.filename,
      token.loc.start.line
    );
    buffer.outputExpression(
      `${awaitKeyword}${getRenderExpression(parser, include)}`,
      token.filename,
      token.loc.start.line,
      false
    );
    buffer.writeStatement("}", token.filename, -1);
  }
};

// src/compiler.ts
import { EdgeError as EdgeError4 } from "edge-error";
import * as lexerUtils3 from "edge-lexer/utils";
import { Parser as Parser4, EdgeBuffer as EdgeBuffer2, Stack } from "edge-parser";

// src/cache_manager.ts
var CacheManager = class {
  constructor(enabled) {
    this.enabled = enabled;
  }
  #cacheStore = /* @__PURE__ */ new Map();
  /**
   * Returns a boolean to tell if a template has already been cached
   * or not.
   */
  has(absPath) {
    return this.#cacheStore.has(absPath);
  }
  /**
   * Returns the template from the cache. If caching is disabled,
   * then it will return undefined.
   */
  get(absPath) {
    if (!this.enabled) {
      return;
    }
    return this.#cacheStore.get(absPath);
  }
  /**
   * Set's the template path and the payload to the cache. If
   * cache is disabled, then this function results in a noop.
   */
  set(absPath, payload) {
    if (!this.enabled) {
      return;
    }
    this.#cacheStore.set(absPath, payload);
  }
  /**
   * Delete template from the compiled cache
   */
  delete(absPath) {
    if (!this.enabled) {
      return;
    }
    this.#cacheStore.delete(absPath);
  }
};

// src/compiler.ts
var AsyncFunction = Object.getPrototypeOf(async function() {
}).constructor;
var Compiler = class {
  /**
   * The variables someone can access inside templates. All other
   * variables will get prefixed with `state` property name
   */
  #inlineVariables = ["$filename", "state", "$context"];
  /**
   * A fixed set of params to pass to the template every time.
   */
  #templateParams = ["template", "state", "$context"];
  #claimTagFn;
  #loader;
  #tags;
  #processor;
  constructor(loader, tags, processor, options = {
    cache: true,
    async: false,
    compat: false
  }) {
    this.#processor = processor;
    this.#loader = loader;
    this.#tags = tags;
    this.async = !!options.async;
    this.compat = options.compat === true;
    this.cacheManager = new CacheManager(!!options.cache);
  }
  /**
   * Merges sections of base template and parent template tokens
   */
  #mergeSections(base, extended) {
    const extendedSections = {};
    const extendedSetCalls = [];
    extended.forEach((node) => {
      if (lexerUtils3.isTag(node, "layout") || node.type === "newline" || node.type === "raw" && !node.value.trim() || node.type === "comment") {
        return;
      }
      if (lexerUtils3.isTag(node, "section")) {
        extendedSections[node.properties.jsArg.trim()] = node;
        return;
      }
      if (lexerUtils3.isTag(node, "set")) {
        extendedSetCalls.push(node);
        return;
      }
      const [line, col] = lexerUtils3.getLineAndColumn(node);
      throw new EdgeError4(
        'Template extending a layout can only use "@section" or "@set" tags as top level nodes',
        "E_UNALLOWED_EXPRESSION",
        { line, col, filename: node.filename }
      );
    });
    const finalNodes = base.map((node) => {
      if (!lexerUtils3.isTag(node, "section")) {
        return node;
      }
      const sectionName = node.properties.jsArg.trim();
      const extendedNode = extendedSections[sectionName];
      if (!extendedNode) {
        return node;
      }
      if (extendedNode.children.length) {
        if (lexerUtils3.isTag(extendedNode.children[0], "super")) {
          extendedNode.children.shift();
          extendedNode.children = node.children.concat(extendedNode.children);
        } else if (lexerUtils3.isTag(extendedNode.children[1], "super")) {
          extendedNode.children.shift();
          extendedNode.children.shift();
          extendedNode.children = node.children.concat(extendedNode.children);
        }
      }
      return extendedNode;
    });
    return [].concat(extendedSetCalls).concat(finalNodes);
  }
  /**
   * Generates an array of lexer tokens from the template string. Further tokens
   * are checked for layouts and if layouts are used, their sections will be
   * merged together.
   */
  #templateContentToTokens(content, parser, absPath) {
    let templateTokens = parser.tokenize(content, { filename: absPath });
    if (this.compat) {
      const firstToken = templateTokens[0];
      if (lexerUtils3.isTag(firstToken, "layout")) {
        const layoutName = firstToken.properties.jsArg.replace(/'|"/g, "");
        templateTokens = this.#mergeSections(this.tokenize(layoutName, parser), templateTokens);
      }
    }
    return templateTokens;
  }
  /**
   * Returns the parser instance for a given template
   */
  #getParserFor(templatePath, localVariables) {
    const parser = new Parser4(this.#tags, new Stack(), {
      claimTag: this.#claimTagFn,
      async: this.async,
      statePropertyName: "state",
      escapeCallPath: ["template", "escape"],
      localVariables: this.#inlineVariables,
      onTag: (tag) => this.#processor.executeTag({ tag, path: templatePath })
    });
    if (localVariables) {
      localVariables.forEach((localVariable) => parser.stack.defineVariable(localVariable));
    }
    return parser;
  }
  /**
   * Returns the parser instance for a given template
   */
  #getBufferFor(templatePath) {
    return new EdgeBuffer2(templatePath, {
      outputVar: "out",
      rethrowCallPath: ["template", "reThrow"]
    });
  }
  /**
   * Wraps template output to a function along with local variables
   */
  #wrapToFunction(template, localVariables) {
    const args = localVariables ? this.#templateParams.concat(localVariables) : this.#templateParams;
    if (this.async) {
      return new AsyncFunction(...args, template);
    }
    return new Function(...args, template);
  }
  /**
   * Define a function to claim tags
   */
  claimTag(fn) {
    this.#claimTagFn = fn;
    return this;
  }
  /**
   * Converts the template content to an array of lexer tokens. The method is
   * same as the `parser.tokenize`, but it also handles layouts natively.
   *
   * ```
   * compiler.tokenize('<template-path>')
   * ```
   */
  tokenize(templatePath, parser) {
    const absPath = this.#loader.makePath(templatePath);
    let { template } = this.#loader.resolve(absPath);
    return this.tokenizeRaw(template, absPath, parser);
  }
  /**
   * Tokenize a raw template
   */
  tokenizeRaw(contents, templatePath = "eval.edge", parser) {
    contents = this.#processor.executeRaw({ path: templatePath, raw: contents });
    return this.#templateContentToTokens(
      contents,
      parser || this.#getParserFor(templatePath),
      templatePath
    );
  }
  /**
   * Compiles the template contents to string. The output is same as the `edge-parser`,
   * it's just that the compiler uses the loader to load the templates and also
   * handles layouts.
   *
   * ```js
   * compiler.compile('welcome')
   * ```
   */
  compile(templatePath, localVariables) {
    const absPath = this.#loader.makePath(templatePath);
    let cachedResponse = localVariables ? null : this.cacheManager.get(absPath);
    if (!cachedResponse) {
      const parser = this.#getParserFor(absPath, localVariables);
      const buffer = this.#getBufferFor(absPath);
      const templateTokens = this.tokenize(absPath, parser);
      templateTokens.forEach((token) => parser.processToken(token, buffer));
      const template = this.#processor.executeCompiled({
        path: absPath,
        compiled: buffer.flush()
      });
      const compiledTemplate = this.#wrapToFunction(template, localVariables);
      if (!localVariables) {
        this.cacheManager.set(absPath, compiledTemplate);
      }
      cachedResponse = compiledTemplate;
    }
    return cachedResponse;
  }
  /**
   * Compiles the template contents to string. The output is same as the `edge-parser`,
   * it's just that the compiler uses the loader to load the templates and also
   * handles layouts.
   *
   * ```js
   * compiler.compileRaw('welcome')
   * ```
   */
  compileRaw(contents, templatePath = "eval.edge") {
    const parser = this.#getParserFor(templatePath);
    const buffer = this.#getBufferFor(templatePath);
    const templateTokens = this.tokenizeRaw(contents, templatePath, parser);
    templateTokens.forEach((token) => parser.processToken(token, buffer));
    const template = this.#processor.executeCompiled({
      path: templatePath,
      compiled: buffer.flush()
    });
    return this.#wrapToFunction(template);
  }
};

// src/edge/globals.ts
import stringify from "js-stringify";
import classNames from "classnames";
import inspect from "@poppinss/inspect";
import string2 from "@poppinss/utils/string";
var edgeGlobals = {
  /**
   * Converts new lines to break
   */
  nl2br: (value) => {
    if (!value) {
      return;
    }
    return String(value).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, "$1<br>");
  },
  /**
   * Inspect state
   */
  inspect: (value) => {
    return htmlSafe(inspect.string.html(value));
  },
  /**
   * Truncate a sentence
   */
  truncate: (value, length = 20, options) => {
    options = options || {};
    return string2.truncate(value, length, {
      completeWords: options.completeWords !== void 0 ? options.completeWords : !options.strict,
      suffix: options.suffix
    });
  },
  /**
   * Generate an excerpt
   */
  excerpt: (value, length = 20, options) => {
    options = options || {};
    return string2.excerpt(value, length, {
      completeWords: options.completeWords !== void 0 ? options.completeWords : !options.strict,
      suffix: options.suffix
    });
  },
  /**
   * Helpers related to HTML
   */
  html: {
    escape,
    safe: htmlSafe,
    classNames,
    attrs: (values) => {
      return htmlSafe(stringifyAttributes(values));
    }
  },
  /**
   * Helpers related to JavaScript
   */
  js: {
    stringify
  },
  camelCase: string2.camelCase,
  snakeCase: string2.snakeCase,
  dashCase: string2.dashCase,
  pascalCase: string2.pascalCase,
  capitalCase: string2.capitalCase,
  sentenceCase: string2.sentenceCase,
  dotCase: string2.dotCase,
  noCase: string2.noCase,
  titleCase: string2.titleCase,
  pluralize: string2.pluralize,
  sentence: string2.sentence,
  prettyMs: string2.milliseconds.format,
  toMs: string2.milliseconds.parse,
  prettyBytes: string2.bytes.format,
  toBytes: string2.bytes.parse,
  ordinal: string2.ordinal
};

// src/processor.ts
var Processor = class {
  #handlers = /* @__PURE__ */ new Map();
  /**
   * Execute tag handler
   */
  executeTag(data) {
    const handlers = this.#handlers.get("tag");
    if (!handlers) {
      return;
    }
    handlers.forEach((handler) => {
      handler(data);
    });
  }
  /**
   * Execute raw handlers
   */
  executeRaw(data) {
    const handlers = this.#handlers.get("raw");
    if (!handlers) {
      return data.raw;
    }
    handlers.forEach((handler) => {
      const output = handler(data);
      if (output !== void 0) {
        data.raw = output;
      }
    });
    return data.raw;
  }
  /**
   * Execute compiled handlers
   */
  executeCompiled(data) {
    const handlers = this.#handlers.get("compiled");
    if (!handlers) {
      return data.compiled;
    }
    handlers.forEach((handler) => {
      const output = handler(data);
      if (output !== void 0) {
        data.compiled = output;
      }
    });
    return data.compiled;
  }
  /**
   * Execute output handlers
   */
  executeOutput(data) {
    const handlers = this.#handlers.get("output");
    if (!handlers) {
      return data.output;
    }
    handlers.forEach((handler) => {
      const output = handler(data);
      if (output !== void 0) {
        data.output = output;
      }
    });
    return data.output;
  }
  process(event, handler) {
    if (!this.#handlers.has(event)) {
      this.#handlers.set(event, /* @__PURE__ */ new Set());
    }
    this.#handlers.get(event).add(handler);
    return this;
  }
};

// src/edge/renderer.ts
import lodash4 from "@poppinss/utils/lodash";
var EdgeRenderer = class {
  #compiler;
  #processor;
  #asyncCompiler;
  /**
   * Global state
   */
  #locals = {};
  #globals;
  constructor(compiler, asyncCompiler, processor, globals) {
    this.#compiler = compiler;
    this.#asyncCompiler = asyncCompiler;
    this.#processor = processor;
    this.#globals = globals;
  }
  /**
   * Share local variables with the template. They will overwrite the
   * globals
   */
  share(data) {
    lodash4.merge(this.#locals, data);
    return this;
  }
  /**
   * Render the template
   */
  async render(templatePath, state = {}) {
    return new Template(this.#asyncCompiler, this.#globals, this.#locals, this.#processor).render(
      templatePath,
      state
    );
  }
  /**
   * Render the template
   */
  renderSync(templatePath, state = {}) {
    return new Template(
      this.#compiler,
      this.#globals,
      this.#locals,
      this.#processor
    ).render(templatePath, state);
  }
  /**
   * Render the template from a raw string
   */
  async renderRaw(contents, state = {}, templatePath) {
    return new Template(
      this.#asyncCompiler,
      this.#globals,
      this.#locals,
      this.#processor
    ).renderRaw(contents, state, templatePath);
  }
  /**
   * Render the template from a raw string
   */
  renderRawSync(contents, state = {}, templatePath) {
    return new Template(this.#compiler, this.#globals, this.#locals, this.#processor).renderRaw(
      contents,
      state,
      templatePath
    );
  }
};

// src/plugins/supercharged.ts
var SuperChargedComponents = class {
  #edge;
  #components = {};
  constructor(edge2) {
    this.#edge = edge2;
    this.#claimTags();
    this.#transformTags();
  }
  /**
   * Refreshes the list of components
   */
  refreshComponents() {
    this.#components = this.#edge.loader.listComponents().reduce((result, { components }) => {
      components.forEach((component) => {
        result[component.tagName] = component.componentName;
      });
      return result;
    }, {});
  }
  /**
   * Registers hook to claim self processing of tags that
   * are references to components
   */
  #claimTags() {
    this.#edge.compiler.claimTag((name) => {
      if (this.#components[name]) {
        return { seekable: true, block: true };
      }
      return null;
    });
    this.#edge.asyncCompiler.claimTag((name) => {
      if (this.#components[name]) {
        return { seekable: true, block: true };
      }
      return null;
    });
  }
  /**
   * Transforms tags to component calls
   */
  #transformTags() {
    this.#edge.processor.process("tag", ({ tag }) => {
      const component = this.#components[tag.properties.name];
      if (!component) {
        return;
      }
      tag.properties.name = "component";
      if (tag.properties.jsArg.trim() === "") {
        tag.properties.jsArg = `'${component}'`;
      } else {
        tag.properties.jsArg = `'${component}',${tag.properties.jsArg}`;
      }
    });
  }
};
var superCharged;
var pluginSuperCharged = (edge2, firstRun) => {
  if (firstRun) {
    superCharged = new SuperChargedComponents(edge2);
  }
  superCharged.refreshComponents();
};

// src/edge/main.ts
var Edge = class _Edge {
  constructor(options = {}) {
    /**
     * An array of bundled plugins
     */
    this.#bundledPlugins = [];
    /**
     * An array of registered plugins
     */
    this.#plugins = [];
    /**
     * Array of registered renderer hooks
     */
    this.#renderCallbacks = [];
    /**
     * Reference to the registered processor handlers
     */
    this.processor = new Processor();
    /**
     * A flag to know if using compat mode
     */
    this.compat = false;
    /**
     * Globals are shared with all rendered templates
     */
    this.globals = { ...edgeGlobals };
    /**
     * List of registered tags. Adding new tags will only impact
     * this list
     */
    this.tags = {};
    this.configure(options);
    Object.keys(main_exports).forEach((name) => {
      this.registerTag(main_exports[name]);
    });
    this.#bundledPlugins.push({
      fn: pluginSuperCharged,
      executed: false,
      options: { recurring: !options.cache }
    });
  }
  /**
   * Create an instance of edge with given options
   */
  static create(options = {}) {
    return new _Edge(options);
  }
  #bundledPlugins;
  #plugins;
  #renderCallbacks;
  /**
   * Re-configure an existing edge instance
   */
  configure(options) {
    if (options.loader) {
      this.loader = options.loader;
    } else if (!this.loader) {
      this.loader = new Loader();
    }
    this.compiler = new Compiler(this.loader, this.tags, this.processor, {
      cache: !!options.cache,
      async: false
    });
    this.asyncCompiler = new Compiler(this.loader, this.tags, this.processor, {
      cache: !!options.cache,
      async: true
    });
  }
  /**
   * Execute plugins
   */
  #executePlugins() {
    this.#plugins.filter(({ options, executed }) => {
      if (options && options.recurring) {
        return true;
      }
      return !executed;
    }).forEach((plugin) => {
      plugin.fn(this, !plugin.executed, plugin.options);
      plugin.executed = true;
    });
    this.#bundledPlugins.filter(({ options, executed }) => {
      if (options && options.recurring) {
        return true;
      }
      return !executed;
    }).forEach((plugin) => {
      plugin.fn(this, !plugin.executed, plugin.options);
      plugin.executed = true;
    });
  }
  /**
   * Register a plugin. Plugins are called only once just before
   * a rendering a view.
   *
   * You can invoke a plugin multiple times by marking it as a
   * recurring plugin
   */
  use(pluginFn, options) {
    this.#plugins.push({
      fn: pluginFn,
      executed: false,
      options
    });
    return this;
  }
  mount(diskName, viewsDirectory) {
    if (!viewsDirectory) {
      viewsDirectory = diskName;
      diskName = "default";
    }
    this.loader.mount(diskName, viewsDirectory);
    return this;
  }
  /**
   * Un Mount a disk from the loader.
   *
   * ```js
   * edge.unmount('admin')
   * ```
   */
  unmount(diskName) {
    this.loader.unmount(diskName);
    return this;
  }
  /**
   * Add a new global to the edge globals. The globals are available
   * to all the templates.
   *
   * ```js
   * edge.global('username', 'virk')
   * edge.global('time', () => new Date().getTime())
   * ```
   */
  global(name, value) {
    this.globals[name] = value;
    return this;
  }
  /**
   * Add a new tag to the tags list.
   *
   * ```ts
   * edge.registerTag('svg', {
   *   block: false,
   *   seekable: true,
   *
   *   compile (parser, buffer, token) {
   *     const fileName = token.properties.jsArg.trim()
   *     buffer.writeRaw(fs.readFileSync(__dirname, 'assets', `${fileName}.svg`), 'utf-8')
   *   }
   * })
   * ```
   */
  registerTag(tag) {
    if (typeof tag.boot === "function") {
      tag.boot(Template);
    }
    this.tags[tag.tagName] = tag;
    return this;
  }
  /**
   * Register an in-memory template.
   *
   * ```ts
   * edge.registerTemplate('button', {
   *   template: `<button class="{{ this.type || 'primary' }}">
   *     @!yield($slots.main())
   *   </button>`,
   * })
   * ```
   *
   * Later you can use this template
   *
   * ```edge
   * @component('button', type = 'primary')
   *   Get started
   * @endcomponent
   * ```
   */
  registerTemplate(templatePath, contents) {
    this.loader.register(templatePath, contents);
    return this;
  }
  /**
   * Remove the template registered using the "registerTemplate" method
   */
  removeTemplate(templatePath) {
    this.loader.remove(templatePath);
    this.compiler.cacheManager.delete(templatePath);
    this.asyncCompiler.cacheManager.delete(templatePath);
    return this;
  }
  /**
   * Get access to the underlying template renderer. Each render call
   * to edge results in creating an isolated renderer instance.
   */
  onRender(callback) {
    this.#renderCallbacks.push(callback);
    return this;
  }
  /**
   * Returns a new instance of edge. The instance
   * can be used to define locals.
   */
  createRenderer() {
    this.#executePlugins();
    const renderer = new EdgeRenderer(
      this.compiler,
      this.asyncCompiler,
      this.processor,
      this.globals
    );
    this.#renderCallbacks.forEach((callback) => callback(renderer));
    return renderer;
  }
  /**
   * Render a template with optional state
   *
   * ```ts
   * edge.render('welcome', { greeting: 'Hello world' })
   * ```
   */
  render(templatePath, state) {
    return this.createRenderer().render(templatePath, state);
  }
  /**
   * Render a template asynchronously with optional state
   *
   * ```ts
   * edge.render('welcome', { greeting: 'Hello world' })
   * ```
   */
  renderSync(templatePath, state) {
    return this.createRenderer().renderSync(templatePath, state);
  }
  /**
   * Render a template with optional state
   *
   * ```ts
   * edge.render('welcome', { greeting: 'Hello world' })
   * ```
   */
  renderRaw(contents, state, templatePath) {
    return this.createRenderer().renderRaw(contents, state, templatePath);
  }
  /**
   * Render a template asynchronously with optional state
   *
   * ```ts
   * edge.render('welcome', { greeting: 'Hello world' })
   * ```
   */
  renderRawSync(templatePath, state) {
    return this.createRenderer().renderRawSync(templatePath, state);
  }
  /**
   * Share locals with the current view context.
   *
   * ```js
   * const view = edge.createRenderer()
   *
   * // local state for the current render
   * view.share({ foo: 'bar' })
   *
   * view.render('welcome')
   * ```
   */
  share(data) {
    return this.createRenderer().share(data);
  }
};

// index.ts
var edge = Edge.create();
var edge_js_default = edge;
export {
  Edge,
  Template,
  edge_js_default as default,
  edgeGlobals
};
//# sourceMappingURL=index.js.map