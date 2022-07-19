import { TrContext } from "../translations/translations.mjs";
import { Variable, ValueBase, Fraction} from "./math_values.mjs";
import {ChangeSignOnTerms} from "./math_rule_base.mjs";

class MathTrEn extends TrContext {
  constructor(ctx, strings) {
    super(ctx, 'en', {...strings,
      sub:'subtract', mul:'multiply', div:'divide', exp: 'exponent',
    })
  }
}

class MathTrSv extends TrContext {
  constructor(ctx, strings) {
    super(ctx, 'sv', {...strings,
      add: 'addera', sub:'subtrahera', mul:'multiplicera',div:'dividera',
      exp: 'upphöja', root: 'rot', nthRoot: 'nrRot',
      integer: 'heltal', float:'decimaltal',fraction:'bråk',variable:'variabel',
    })
  }
}

new MathTrSv(ValueBase, {
  'nonmulerr': `Kan inte $1 en variabel till ett $2`,
  'interr': `Internt fel, kan inte convertera $1 till en Value class`,
});

new MathTrSv(Variable, {
  'toNumber': "Kan inte convertera en variable til ett nummer",
  'typeErr': `Kan inte $1 en $2 typ med en $3 typ.`,
  'addSubErr': `Kan inte $1 en $2 med en $3`,
  'diffNameErr': `Kan inte $1 en variable med annat namn i en variabel kontext.`,
  'diffExpErr': `Kan inte $1 variabler med olika exponeter direkt, måste faktoriseras först`,
});

new MathTrSv(Fraction, {
  'varMulDenErr': `Kan inte multiplicera ett bråk som har en variable i nämnaren`,
  'invExpInput': `Ogilltigt ingångsvärde till bråk expansion`,
  'Shrink factor to big': 'Krympfaktor för stor',
  'fltVluErr': `Kan inte $1 ett flyttal till ett $2`,
  'varVluErr': `Kan inte $1 en variabel till ett $2`,
  'sqRtErr': `Kan inte ta rooten ur ett bråk som har variabler i sig`,
  'nthRtErr': `Kan inte ta nrRooten ur ett bråk som har variabler i sig`,
});

// ---------------------------------------------------------------------
// math_rule_base.mjs

new MathTrSv(ChangeSignOnTerms, {
  "Uneven signs becomes '-'": "Olika tecken blir '-'",
  "Equal signs becomes '+'": "Lika tecken blir '+'",
  'description': "Byter tecken på all termer med +-",
});
