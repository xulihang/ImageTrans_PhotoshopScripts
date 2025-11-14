var fontMap = {"Arial":"ArialMT"};

function substituteFontName(fontname){
    if (fontname in fontMap) {
        return fontMap[fontname];
    }
    return fontname;
}