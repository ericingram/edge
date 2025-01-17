import {
  __export,
  escape,
  htmlSafe,
  isSubsetOf,
  parseJsArg,
  unallowedExpression
} from "../../chunk-DWGXHKFF.js";

// src/migrate/tags/main.ts
var main_exports = {};
__export(main_exports, {
  layout: () => layoutTag,
  section: () => sectionTag,
  set: () => setTag,
  super: () => superTag
});

// src/migrate/tags/set.ts
import { EdgeError } from "edge-error";
import { expressions } from "edge-parser";
import lodash from "@poppinss/utils/lodash";
var setTag = {
  block: false,
  seekable: true,
  tagName: "set",
  noNewLine: true,
  /**
   * Compiles else block node to Javascript else statement
   */
  compile(parser, buffer, token) {
    const parsed = parseJsArg(parser, token);
    isSubsetOf(parsed, [expressions.SequenceExpression], () => {
      throw unallowedExpression(
        `"${token.properties.jsArg}" is not a valid key-value pair for the @slot tag`,
        token.filename,
        parser.utils.getExpressionLoc(parsed)
      );
    });
    if (parsed.expressions.length < 2 || parsed.expressions.length > 3) {
      throw new EdgeError(
        "@set tag accepts a minimum of 2 or maximum or 3 arguments",
        "E_INVALID_ARGUMENTS_COUNT",
        {
          line: parsed.loc.start.line,
          col: parsed.loc.start.column,
          filename: token.filename
        }
      );
    }
    let collection;
    let key;
    let value;
    if (parsed.expressions.length === 3) {
      collection = parsed.expressions[0];
      key = parsed.expressions[1];
      value = parsed.expressions[2];
    } else {
      key = parsed.expressions[0];
      value = parsed.expressions[1];
    }
    if (collection) {
      buffer.writeExpression(
        `template.setValue(${parser.utils.stringify(collection)}, '${key.value}', ${parser.utils.stringify(value)})`,
        token.filename,
        token.loc.start.line
      );
      return;
    }
    const expression = parser.stack.has(key.value) ? `${key.value} = ${parser.utils.stringify(value)}` : `let ${key.value} = ${parser.utils.stringify(value)}`;
    buffer.writeExpression(expression, token.filename, token.loc.start.line);
    parser.stack.defineVariable(key.value);
  },
  /**
   * Add methods to the template for running the loop
   */
  boot(template) {
    template.macro("setValue", lodash.set);
  }
};

// src/migrate/tags/super.ts
import { EdgeError as EdgeError2 } from "edge-error";
var superTag = {
  block: false,
  seekable: false,
  tagName: "super",
  compile(_, __, token) {
    throw new EdgeError2(
      "@super tag must appear as top level tag inside the @section tag",
      "E_ORPHAN_SUPER_TAG",
      {
        line: token.loc.start.line,
        col: token.loc.start.col,
        filename: token.filename
      }
    );
  }
};

// src/migrate/tags/layout.ts
var layoutTag = {
  block: false,
  seekable: true,
  tagName: "layout",
  noNewLine: true,
  compile() {
  }
};

// src/migrate/tags/section.ts
var sectionTag = {
  block: true,
  seekable: true,
  tagName: "section",
  compile(parser, buffer, token) {
    token.children.forEach((child) => parser.processToken(child, buffer));
  }
};

// src/migrate/globals.ts
import { EdgeError as EdgeError3 } from "edge-error";
import stringify from "js-stringify";
import inspect from "@poppinss/inspect";
import string from "@poppinss/utils/string";
var { string: prettyPrintHtml } = inspect;
var GLOBALS = {
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
    return htmlSafe(prettyPrintHtml.html(value));
  },
  /**
   * Truncate a sentence
   */
  truncate: (value, length = 20, options) => {
    options = options || {};
    return string.truncate(value, length, {
      completeWords: options.completeWords !== void 0 ? options.completeWords : !options.strict,
      suffix: options.suffix
    });
  },
  /**
   * Raise an exception
   */
  raise: (message, options) => {
    if (!options) {
      throw new Error(message);
    } else {
      throw new EdgeError3(message, "E_RUNTIME_EXCEPTION", options);
    }
  },
  /**
   * Generate an excerpt
   */
  excerpt: (value, length = 20, options) => {
    options = options || {};
    return string.excerpt(value, length, {
      completeWords: options.completeWords !== void 0 ? options.completeWords : !options.strict,
      suffix: options.suffix
    });
  },
  /**
   * Using `"e"` because, `escape` is a global function in the
   * Node.js global namespace and edge parser gives priority
   * to it
   */
  e: escape,
  /**
   * Convert javascript data structures to a string. The method is a little
   * better over JSON.stringify in handling certain data structures. For
   * example: In JSON.stringify, the date is converted to an ISO string
   * whereas this method converts it to an actual instance of date
   */
  stringify,
  safe: htmlSafe,
  camelCase: string.camelCase,
  snakeCase: string.snakeCase,
  dashCase: string.dashCase,
  pascalCase: string.pascalCase,
  capitalCase: string.capitalCase,
  sentenceCase: string.sentenceCase,
  dotCase: string.dotCase,
  noCase: string.noCase,
  titleCase: string.titleCase,
  pluralize: string.pluralize,
  sentence: string.sentence,
  prettyMs: string.milliseconds.format,
  toMs: string.milliseconds.parse,
  prettyBytes: string.bytes.format,
  toBytes: string.bytes.parse,
  ordinal: string.ordinal
};

// src/migrate/plugin.ts
var migrate = (edge) => {
  edge.compat = true;
  edge.compiler.compat = true;
  edge.asyncCompiler.compat = true;
  Object.keys(GLOBALS).forEach((name) => {
    edge.global(name, GLOBALS[name]);
  });
  Object.keys(main_exports).forEach((name) => {
    edge.registerTag(main_exports[name]);
  });
};
export {
  migrate
};
//# sourceMappingURL=plugin.js.map