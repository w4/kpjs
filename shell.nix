with import <nixpkgs> {};
stdenv.mkDerivation {
    name = "kpjs";
    buildInputs = [
      nodejs python
    ];
}
