import { TrContext } from "../translations/translations.mjs";
import { Variable, ValueBase, Fraction} from "./math_values.mjs";


new TrContext(ValueBase, 'sv', {
  nonmulerr: `Kan inte $1 en variabel till ett $2`,
  interr: `Internt fel, kan inte convertera $1 till en Value class`,
  add: 'addera', sub:'subtrahera', mul:'multiplicera',div:'dividera',
  exp: 'upphöja', root: 'rot', nthRoot: 'nrRot',
  integer: 'heltal', float:'decimaltal',fraction:'bråk',variable:'variabel',

});

new TrContext(Variable, 'sv', {
  toNumber: "Kan inte convertera en variable til ett nummer",
  typeErr: `Kan inte $1 en $2 typ med en $3 typ.`,
  addSubErr: `Kan inte $1 en $2 med en $3`,
  diffNameErr: `Kan inte $1 en variable med annat namn i en variabel kontext.`,
  diffExpErr: `Kan inte $1 variabler med olika exponeter direkt, måste faktoriseras först`,
});

new TrContext(Fraction, 'sv', {
  varMulDenErr: `Kan inte multiplicera ett bråk som har en variable i nämnaren`,
  invExpInput: `Ogilltigt ingångsvärde till bråk expansion`,
  'Shrink factor to big': 'Krympfaktor för stor',
  fltVluErr: `Kan inte $1 ett flyttal till ett $2`,
  varVluErr: `Kan inte $1 en variabel till ett $2`,
  sqRtErr: `Kan inte ta rooten ur ett bråk som har variabler i sig`,
  nthRtErr: `Kan inte ta nrRooten ur ett bråk som har variabler i sig`,
});
