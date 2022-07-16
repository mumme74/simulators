
const translationObjRoot = {
  glblLang: globalThis.document.documentElement.lang,
  en: {}, sv:{},
}

const ctxStr = (objCtx) => {
  return (typeof objCtx === 'function') ?
    objCtx.name : typeof objCtx === 'object' ?
      objCtx.constructor.name : objCtx;
}

export class TrContext {
  constructor(ctx, lang, strings) {
    this.context = ctx;
    this.strings = strings;
    if (!translationObjRoot[lang])
      translationObjRoot[lang] = {};
    translationObjRoot[lang][ctxStr(ctx)] = this;
  }

  t (key, str) {
    if (str) {
      let string = this.strings[key];
      for(let ctx = this.context;
          !string && ctx;
          ctx = Object.getPrototypeOf(ctx))
      {
        string = ctx?.strings ? ctx.strings[key] : undefined;
      }
      const res = [...arguments].slice(2).reduce((v, itm, i)=>{
              v = v.replace(new RegExp(`\\$${i+1}`), itm);
              return v;
            }, (string || str));
      return res;
    }
    return this.strings[key] || key;
  }
}

class NullRelay {}
new TrContext(NullRelay,'_',{})

export function getTrObj(objCtx, lang = translationObjRoot.glblLang) {
  const root = translationObjRoot;
  for (let ctx = objCtx; ctx; ctx = Object.getPrototypeOf(ctx)) {
    const ctxString = ctxStr(ctx);
    if (root[lang] && root[lang][ctxString])
      return root[lang][ctxString];
  }
  return root['_'].NullRelay;
}

export function getTr(objCtx, lang = translationObjRoot.glblLang) {
  const trObj = getTrObj(objCtx, lang);
  return trObj.t.bind(trObj);
}

export function setTranslationLang(lang) {
  translationObjRoot.glblLang = lang;
}

setTranslationLang('sv')

