let currentThemeName = resolveThemeName(localStorage.getItem('nrb-theme')) || 'dark';
let currentTitle = localStorage.getItem('nrb-title') || '';
let currentTitleFont = (() => { const v = Number(localStorage.getItem('nrb-title-font')); return (v && v > 0) ? v : 36; })();
let currentLvlFont = (() => { const v = Number(localStorage.getItem('nrb-lvl-font')); return (v && v > 0) ? v : 17; })();
let showTotalPots = localStorage.getItem('nrb-show-total-pots') !== 'false';
let showTotalPotsCount = localStorage.getItem('nrb-show-total-pots-count') === 'true';
let totalPotsCountPrefix = localStorage.getItem('nrb-total-pots-count-prefix');
if (totalPotsCountPrefix === null) totalPotsCountPrefix = 'Total Pots';
let _lastRecordPngBlob = null;
const DEJAVU_MONO_B64 = "data:font/woff2;base64,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";

// DejaVu Sans Mono Bold glyph outlines (font units, Y-up) for the level label:
// digits, printable ASCII and ★/☆. Drawn as paths so the label renders
// identically on every OS/browser without depending on a web font.
const LVL_GLYPHS = {
  " ": "",
  "!": "M483 283H750V0H483ZM483 1493H750V838L717 481H518L483 838Z",
  "\"": "M999 1493V938H743V1493ZM487 1493V938H231V1493Z",
  "#": "M707 1470 612 1096H815L909 1470H1133L1036 1096H1229V881H983L909 588H1114V373H856L762 0H541L635 373H430L336 0H115L209 373H2V588H262L336 881H117V1096H391L485 1470ZM762 881H557L483 588H688Z",
  "$": "M694 528V226Q757 235 792 274.5Q827 314 827 375Q827 437 792.5 476.5Q758 516 694 528ZM553 817V1100Q491 1092 459.5 1058.5Q428 1025 428 967Q428 910 459.5 872Q491 834 553 817ZM694 -301H553L552 0Q465 3 370 26Q275 49 172 92V354Q275 293 371.5 260Q468 227 553 226V555Q356 594 260 689.5Q164 785 164 942Q164 1109 266 1208Q368 1307 553 1319V1556H694L695 1319Q766 1315 842.5 1301Q919 1287 999 1262V1006Q937 1046 861 1070Q785 1094 694 1100V793Q891 762 991.5 658.5Q1092 555 1092 383Q1092 219 983.5 114Q875 9 695 0Z",
  "%": "M33 1112Q33 1246 126 1339Q219 1432 352 1432Q485 1432 578.5 1338.5Q672 1245 672 1112Q672 979 578.5 886Q485 793 352 793Q219 793 126 885.5Q33 978 33 1112ZM352 1249Q295 1249 255 1209.5Q215 1170 215 1112Q215 1054 255 1014.5Q295 975 352 975Q410 975 449.5 1014.5Q489 1054 489 1112Q489 1169 449 1209Q409 1249 352 1249ZM86 561 1128 979 1169 883 121 465ZM580 319Q580 453 672.5 546Q765 639 899 639Q1031 639 1125 545.5Q1219 452 1219 319Q1219 187 1125 93.5Q1031 0 899 0Q765 0 672.5 92.5Q580 185 580 319ZM897 457Q841 457 801.5 417Q762 377 762 319Q762 261 801 221.5Q840 182 897 182Q955 182 995.5 222Q1036 262 1036 319Q1036 376 995 416.5Q954 457 897 457Z",
  "&": "M870 72Q795 22 710.5 -3.5Q626 -29 539 -29Q315 -29 176 102Q37 233 37 442Q37 587 107.5 706Q178 825 317 913Q267 991 243 1057.5Q219 1124 219 1184Q219 1346 328 1433Q437 1520 643 1520Q716 1520 786 1509Q856 1498 924 1477V1221Q860 1257 794.5 1275.5Q729 1294 664 1294Q584 1294 543 1266Q502 1238 502 1184Q502 1148 532.5 1085Q563 1022 631 920L944 440Q965 478 976 527Q987 576 987 633Q987 663 985 691.5Q983 720 979 745H1214V694Q1214 549 1180 440.5Q1146 332 1073 246L1235 0H918ZM440 731Q374 688 340.5 628.5Q307 569 307 496Q307 374 385.5 290.5Q464 207 578 207Q606 207 635.5 213.5Q665 220 693 232Q695 233 701 236Q730 250 748 262Z",
  "'": "M743 1493V938H487V1493Z",
  "(": "M924 1554Q792 1315 728 1091Q664 867 664 643Q664 421 728 195.5Q792 -30 924 -270H696Q537 -39 460 185.5Q383 410 383 643Q383 875 460.5 1100.5Q538 1326 696 1554Z",
  ")": "M309 1554H537Q695 1326 772.5 1100.5Q850 875 850 643Q850 410 773 185.5Q696 -39 537 -270H309Q441 -30 505 195.5Q569 421 569 643Q569 867 505 1091Q441 1315 309 1554Z",
  "*": "M1108 1217 778 1044 1108 870 1032 729 700 913V569H528V913L197 729L121 870L453 1044L121 1217L197 1358L528 1176V1520H700V1176L1032 1358Z",
  "+": "M735 1192V762H1165V524H735V92H498V524H66V762H498V1192Z",
  ",": "M461 367H774V96L578 -287H362L461 96Z",
  "-": "M301 735H932V444H301Z",
  ".": "M449 367H782V0H449Z",
  "/": "M899 1493H1120L334 -190H113Z",
  "0": "M492 745Q492 798 528 834Q564 870 616 870Q669 870 705 834Q741 798 741 745Q741 693 705 657Q669 621 616 621Q564 621 528 656.5Q492 692 492 745ZM616 1270Q514 1270 467 1145Q420 1020 420 745Q420 471 467 346Q514 221 616 221Q719 221 766 346Q813 471 813 745Q813 1020 766 1145Q719 1270 616 1270ZM123 745Q123 1133 246 1326.5Q369 1520 616 1520Q864 1520 987 1327Q1110 1134 1110 745Q1110 357 987 164Q864 -29 616 -29Q369 -29 246 164.5Q123 358 123 745Z",
  "1": "M188 260H518V1229L211 1153V1419L520 1493H805V260H1135V0H188Z",
  "2": "M434 260H1063V0H115V252L275 422Q560 725 621 795Q696 881 729 947.5Q762 1014 762 1079Q762 1179 701.5 1233.5Q641 1288 530 1288Q451 1288 352.5 1256.5Q254 1225 147 1165V1440Q254 1479 356.5 1499.5Q459 1520 553 1520Q790 1520 925.5 1409.5Q1061 1299 1061 1108Q1061 1020 1031.5 943Q1002 866 930 772Q877 704 639 466Q510 337 434 260Z",
  "3": "M549 668H391V928H549Q659 928 719.5 971.5Q780 1015 780 1094Q780 1177 719.5 1223.5Q659 1270 549 1270Q465 1270 369 1249Q273 1228 170 1188V1456Q273 1487 373 1503.5Q473 1520 565 1520Q801 1520 933 1417Q1065 1314 1065 1133Q1065 1000 989 915.5Q913 831 772 805Q932 777 1016 677.5Q1100 578 1100 416Q1100 199 961 85Q822 -29 557 -29Q444 -29 334.5 -10Q225 9 125 45V319Q219 272 328 247.5Q437 223 557 223Q677 223 747 278.5Q817 334 817 428Q817 543 747 605.5Q677 668 549 668Z",
  "4": "M694 1165 317 575H694ZM668 1493H977V575H1141V322H977V0H694V322H102V608Z",
  "5": "M193 1493H1004V1233H432V956Q468 970 509 976.5Q550 983 596 983Q818 983 956 843Q1094 703 1094 479Q1094 244 944.5 107.5Q795 -29 537 -29Q441 -29 343 -13Q245 3 143 35V301Q226 260 313.5 239.5Q401 219 489 219Q645 219 726 285.5Q807 352 807 479Q807 596 726.5 666.5Q646 737 512 737Q433 737 353.5 717.5Q274 698 193 659Z",
  "6": "M643 748Q547 748 496.5 678.5Q446 609 446 477Q446 346 496.5 276.5Q547 207 643 207Q739 207 790.5 276.5Q842 346 842 477Q842 608 790.5 678Q739 748 643 748ZM1030 1458V1190Q951 1235 878.5 1257.5Q806 1280 739 1280Q579 1280 495.5 1172.5Q412 1065 408 855Q455 920 528 952.5Q601 985 700 985Q902 985 1012 857.5Q1122 730 1122 496Q1122 245 998.5 107Q875 -31 651 -31Q378 -31 254.5 152Q131 335 131 743Q131 1131 282 1324.5Q433 1518 735 1518Q805 1518 879.5 1503Q954 1488 1030 1458Z",
  "7": "M135 1493H1079V1284L573 0H272L758 1233H135Z",
  "8": "M616 666Q517 666 456 603.5Q395 541 395 438Q395 335 456 272Q517 209 616 209Q715 209 776.5 273Q838 337 838 438Q838 541 777 603.5Q716 666 616 666ZM397 791Q284 830 225 913.5Q166 997 166 1118Q166 1304 287 1412Q408 1520 616 1520Q825 1520 946 1412Q1067 1304 1067 1118Q1067 998 1009 914.5Q951 831 840 791Q964 753 1034 655Q1104 557 1104 420Q1104 205 977 88Q850 -29 616 -29Q383 -29 256 88Q129 205 129 420Q129 558 200 656Q271 754 397 791ZM428 1094Q428 1006 478.5 954.5Q529 903 616 903Q704 903 754.5 954.5Q805 1006 805 1094Q805 1181 754.5 1231.5Q704 1282 616 1282Q530 1282 479 1231Q428 1180 428 1094Z",
  "9": "M203 20V289Q282 243 354.5 221Q427 199 494 199Q653 199 736.5 305.5Q820 412 825 624Q778 559 705 526.5Q632 494 532 494Q331 494 221 621.5Q111 749 111 983Q111 1233 234 1370Q357 1507 582 1507Q855 1507 978.5 1324.5Q1102 1142 1102 735Q1102 348 951 154.5Q800 -39 498 -39Q428 -39 353.5 -24Q279 -9 203 20ZM590 741Q685 741 735.5 810.5Q786 880 786 1012Q786 1143 735.5 1212.5Q685 1282 590 1282Q494 1282 442.5 1212.5Q391 1143 391 1012Q391 881 442.5 811Q494 741 590 741Z",
  ":": "M449 1063H782V698H449ZM449 367H782V0H449Z",
  ";": "M449 367H782V96L586 -287H371L449 96ZM449 1063H782V698H449Z",
  "<": "M1145 926 350 641 1145 358V109L88 524V760L1145 1176Z",
  "=": "M88 532H1145V295H88ZM88 987H1145V752H88Z",
  ">": "M88 926V1176L1145 760V524L88 109V358L883 641Z",
  "?": "M440 283H707V0H440ZM707 401H440V555Q440 654 471 724Q502 794 582 872L672 961Q735 1022 757.5 1062Q780 1102 780 1145Q780 1212 734 1246Q688 1280 596 1280Q512 1280 420.5 1244.5Q329 1209 233 1139V1407Q331 1463 431.5 1491.5Q532 1520 633 1520Q835 1520 950 1426Q1065 1332 1065 1167Q1065 1091 1031 1025.5Q997 960 903 868L815 782Q747 716 728 674Q709 632 709 571Q709 562 708.5 550Q708 538 707 524Z",
  "@": "M973 545Q973 658 922 722Q871 786 782 786Q693 786 642.5 722Q592 658 592 545Q592 431 642.5 367Q693 303 782 303Q871 303 922 367Q973 431 973 545ZM1159 135H963V217Q925 164 873.5 139.5Q822 115 750 115Q586 115 485.5 233Q385 351 385 545Q385 738 485 855.5Q585 973 750 973Q821 973 875 948.5Q929 924 963 877V918Q963 1054 888.5 1128Q814 1202 676 1202Q468 1202 336.5 1019Q205 836 205 543Q205 236 357 54.5Q509 -127 762 -127Q842 -127 917 -103.5Q992 -80 1061 -33L1153 -209Q1072 -264 976.5 -291.5Q881 -319 772 -319Q422 -319 214 -86Q6 147 6 543Q6 930 193 1162.5Q380 1395 688 1395Q906 1395 1032.5 1263.5Q1159 1132 1159 905Z",
  "A": "M616 1223 477 612H756ZM436 1493H797L1200 0H905L813 369H418L328 0H33Z",
  "B": "M410 678V236H606Q747 236 803.5 284Q860 332 860 451Q860 572 801 625Q742 678 606 678ZM410 1260V913H606Q718 913 765.5 953Q813 993 813 1085Q813 1177 764.5 1218.5Q716 1260 606 1260ZM125 1495H606Q855 1495 980.5 1400.5Q1106 1306 1106 1118Q1106 974 1032 893Q958 812 815 799Q986 782 1072.5 684Q1159 586 1159 410Q1159 194 1029 97Q899 0 606 0H125Z",
  "C": "M1081 43Q1011 7 934 -11Q857 -29 772 -29Q470 -29 311 170Q152 369 152 745Q152 1122 311 1321Q470 1520 772 1520Q857 1520 935 1502Q1013 1484 1081 1448V1120Q1005 1190 933.5 1222.5Q862 1255 786 1255Q624 1255 541.5 1126.5Q459 998 459 745Q459 493 541.5 364.5Q624 236 786 236Q862 236 933.5 268.5Q1005 301 1081 371Z",
  "D": "M432 1227V266H512Q686 266 760 375.5Q834 485 834 748Q834 1009 760 1118Q686 1227 512 1227ZM137 1493H453Q819 1493 980 1318.5Q1141 1144 1141 748Q1141 351 980 175.5Q819 0 453 0H137Z",
  "E": "M1098 0H168V1493H1098V1233H463V911H1038V651H463V260H1098Z",
  "F": "M1112 1233H477V911H1055V651H477V0H182V1493H1112Z",
  "G": "M872 270V555H670V803H1130V119Q1045 46 942.5 8.5Q840 -29 723 -29Q433 -29 275 172.5Q117 374 117 745Q117 1122 276.5 1321Q436 1520 737 1520Q827 1520 914 1494.5Q1001 1469 1077 1421V1094Q1015 1174 934.5 1214.5Q854 1255 758 1255Q590 1255 507 1128.5Q424 1002 424 745Q424 496 504 366Q584 236 737 236Q783 236 817 244.5Q851 253 872 270Z",
  "H": "M137 1493H432V924H801V1493H1096V0H801V664H432V0H137Z",
  "I": "M172 1233V1493H1061V1233H764V260H1061V0H172V260H469V1233Z",
  "J": "M109 74V416Q195 328 292.5 282Q390 236 489 236Q605 236 659 294Q713 352 713 479V1233H352V1493H1008V479Q1008 206 893.5 88.5Q779 -29 516 -29Q421 -29 317.5 -3Q214 23 109 74Z",
  "K": "M117 1493H412V903L874 1493H1208L737 905L1225 0H897L543 672L412 506V0H117Z",
  "L": "M225 0V1493H520V260H1151V0Z",
  "M": "M86 1493H438L616 838L793 1493H1147V0H893V1196L735 543H500L340 1196V0H86Z",
  "N": "M119 1493H436L852 408V1493H1112V0H797L379 1085V0H119Z",
  "O": "M616 1255Q503 1255 451 1134.5Q399 1014 399 745Q399 477 451 356.5Q503 236 616 236Q730 236 782 356.5Q834 477 834 745Q834 1014 782 1134.5Q730 1255 616 1255ZM92 745Q92 1128 224.5 1324Q357 1520 616 1520Q876 1520 1008.5 1324Q1141 1128 1141 745Q1141 363 1008.5 167Q876 -29 616 -29Q357 -29 224.5 167Q92 363 92 745Z",
  "P": "M457 1245V807H578Q723 807 781.5 856Q840 905 840 1026Q840 1147 781.5 1196Q723 1245 578 1245ZM162 1493H567Q876 1493 1011.5 1383Q1147 1273 1147 1026Q1147 779 1011.5 669Q876 559 567 559H457V0H162Z",
  "Q": "M656 -23Q642 -26 632.5 -27.5Q623 -29 614 -29Q357 -29 224.5 167Q92 363 92 745Q92 1128 224.5 1324Q357 1520 616 1520Q876 1520 1008.5 1324Q1141 1128 1141 745Q1141 482 1078 304.5Q1015 127 895 51L1081 -131L879 -281ZM616 1255Q503 1255 451 1134.5Q399 1014 399 745Q399 477 451 356.5Q503 236 616 236Q730 236 782 356.5Q834 477 834 745Q834 1014 782 1134.5Q730 1255 616 1255Z",
  "R": "M807 705Q851 696 883.5 663.5Q916 631 963 537L1233 0H909L729 377Q721 393 708 421Q629 590 522 590H428V0H133V1493H559Q847 1493 972.5 1391Q1098 1289 1098 1059Q1098 905 1023 814Q948 723 807 705ZM428 1245V838H567Q688 838 740.5 885.5Q793 933 793 1042Q793 1151 741 1198Q689 1245 567 1245Z",
  "S": "M510 655Q287 740 208 833.5Q129 927 129 1085Q129 1288 259 1404Q389 1520 616 1520Q719 1520 822 1496.5Q925 1473 1026 1427V1139Q931 1206 833 1241Q735 1276 639 1276Q532 1276 475 1233Q418 1190 418 1110Q418 1048 459.5 1007.5Q501 967 633 918L760 870Q940 804 1025 695Q1110 586 1110 420Q1110 194 976.5 82.5Q843 -29 573 -29Q462 -29 350.5 -2.5Q239 24 135 76V381Q253 297 363.5 256Q474 215 582 215Q691 215 751 264.5Q811 314 811 403Q811 470 771 520.5Q731 571 655 600Z",
  "T": "M764 0H469V1235H90V1493H1143V1235H764Z",
  "U": "M106 551V1493H401V477Q401 365 458 301.5Q515 238 616 238Q717 238 774 301.5Q831 365 831 477V1493H1126V551Q1126 247 1005 109Q884 -29 616 -29Q349 -29 227.5 109Q106 247 106 551Z",
  "V": "M616 246 879 1493H1176L821 0H412L57 1493H354Z",
  "W": "M0 1493H258L365 397L494 1106H739L889 397L973 1493H1233L1061 0H786L616 784L457 0H184Z",
  "X": "M1206 0H901L616 494L332 0H27L465 758L39 1493H344L616 1018L889 1493H1194L770 758Z",
  "Y": "M8 1493H326L616 893L907 1493H1225L764 588V0H469V588Z",
  "Z": "M137 1493H1147V1249L455 260H1161V0H115V244L786 1233H137Z",
  "[": "M422 1556H930V1366H688V-80H930V-270H422Z",
  "\\": "M334 1493 1120 -190H897L111 1493Z",
  "]": "M811 1556V-270H303V-80H545V1366H303V1556Z",
  "^": "M739 1493 1176 936H934L616 1237L299 936H57L494 1493Z",
  "_": "M1233 -293V-483H0V-293Z",
  "`": "M481 1638 764 1262H567L199 1638Z",
  "a": "M700 526Q536 526 471 484Q406 442 406 340Q406 264 451 219Q496 174 573 174Q689 174 753 261.5Q817 349 817 506V526ZM1108 639V0H817V125Q764 51 681 11Q598 -29 498 -29Q307 -29 200.5 72Q94 173 94 354Q94 550 221 643.5Q348 737 614 737H817V786Q817 857 765.5 893.5Q714 930 614 930Q509 930 410.5 903.5Q312 877 205 819V1069Q302 1109 402 1128Q502 1147 614 1147Q887 1147 997.5 1036Q1108 925 1108 639Z",
  "b": "M850 557Q850 719 796 811Q742 903 647 903Q552 903 497 811Q442 719 442 557Q442 395 497 303Q552 211 647 211Q742 211 796 303Q850 395 850 557ZM442 961Q496 1054 567.5 1100.5Q639 1147 729 1147Q928 1147 1035.5 995Q1143 843 1143 559Q1143 279 1037 125Q931 -29 739 -29Q638 -29 563 20Q488 69 442 166V0H150V1556H442Z",
  "c": "M1061 57Q987 14 902 -7.5Q817 -29 719 -29Q460 -29 314 127Q168 283 168 559Q168 836 315 992.5Q462 1149 721 1149Q811 1149 894.5 1128Q978 1107 1061 1063V795Q997 850 920.5 879.5Q844 909 762 909Q619 909 542 818Q465 727 465 559Q465 391 542 301Q619 211 762 211Q847 211 921 239.5Q995 268 1061 326Z",
  "d": "M791 961V1556H1083V0H791V166Q744 69 669.5 20Q595 -29 494 -29Q302 -29 196 125Q90 279 90 559Q90 843 197.5 995Q305 1147 504 1147Q594 1147 665.5 1100.5Q737 1054 791 961ZM383 557Q383 395 437 303Q491 211 586 211Q681 211 736 303Q791 395 791 557Q791 719 736 811Q681 903 586 903Q491 903 437 811Q383 719 383 557Z",
  "e": "M1102 55Q1000 13 894 -8Q788 -29 670 -29Q389 -29 240.5 121.5Q92 272 92 555Q92 829 235 988Q378 1147 625 1147Q874 1147 1011.5 999.5Q1149 852 1149 584V465H390Q391 333 468 268Q545 203 698 203Q799 203 897 232Q995 261 1102 324ZM854 685Q852 801 794.5 860.5Q737 920 625 920Q524 920 464 858.5Q404 797 393 684Z",
  "f": "M739 1218V1120H1083V895H739V0H446V895H174V1120H446V1198Q446 1400 530 1478Q614 1556 842 1556H1083V1331H854Q788 1331 764.5 1307Q741 1283 739 1218Z",
  "g": "M803 578Q803 728 746 818.5Q689 909 596 909Q504 909 447.5 819Q391 729 391 578Q391 426 447.5 336Q504 246 596 246Q689 246 746 336.5Q803 427 803 578ZM1096 84Q1096 -185 974.5 -304.5Q853 -424 580 -424Q488 -424 398 -410.5Q308 -397 215 -369V-100Q298 -146 384 -168Q470 -190 561 -190Q685 -190 744 -131.5Q803 -73 803 51V172Q760 92 689 53Q618 14 516 14Q324 14 211 164Q98 314 98 571Q98 837 211 993Q324 1149 514 1149Q610 1149 685 1104Q760 1059 803 977V1120H1096Z",
  "h": "M1071 727V0H780V682Q780 803 745.5 855Q711 907 633 907Q553 907 508 836.5Q463 766 463 641V0H172V1556H463V952Q494 1045 569 1096Q644 1147 750 1147Q909 1147 990 1041.5Q1071 936 1071 727Z",
  "i": "M221 1120H801V225H1165V0H143V225H508V895H221ZM508 1665H801V1323H508Z",
  "j": "M850 43Q850 -209 759.5 -316.5Q669 -424 459 -424H143V-199H377Q475 -199 516 -144Q557 -89 557 43V895H260V1120H850ZM850 1323H557V1665H850Z",
  "k": "M174 1556H467V739L819 1120H1174L750 702L1198 0H874L567 524L467 428V0H174Z",
  "l": "M387 467V1331H90V1556H680V467Q680 335 721 280Q762 225 860 225H1094V0H778Q569 0 478 108Q387 216 387 467Z",
  "m": "M690 1008Q723 1079 774 1113Q825 1147 899 1147Q1044 1147 1099.5 1047Q1155 947 1155 631V0H915V719Q915 844 896 886Q877 928 827 928Q777 928 757 885Q737 842 737 719V0H500V719Q500 842 480 885Q460 928 410 928Q360 928 341 886Q322 844 322 719V0H82V1120H295V1004Q320 1070 375 1108.5Q430 1147 498 1147Q566 1147 622 1106.5Q678 1066 690 1008Z",
  "n": "M1071 727V0H780V682Q780 804 745.5 856.5Q711 909 633 909Q554 909 508.5 838Q463 767 463 641V0H172V1120H463V952Q494 1045 569 1096Q644 1147 750 1147Q909 1147 990 1041.5Q1071 936 1071 727Z",
  "o": "M616 909Q511 909 451 816.5Q391 724 391 559Q391 394 451 301.5Q511 209 616 209Q722 209 782 301.5Q842 394 842 559Q842 724 782 816.5Q722 909 616 909ZM98 559Q98 830 238.5 988.5Q379 1147 616 1147Q854 1147 994.5 988.5Q1135 830 1135 559Q1135 288 994.5 129.5Q854 -29 616 -29Q379 -29 238.5 129.5Q98 288 98 559Z",
  "p": "M442 158V-426H150V1120H442V952Q488 1049 563 1098Q638 1147 739 1147Q931 1147 1037 993Q1143 839 1143 559Q1143 275 1035.5 123Q928 -29 729 -29Q639 -29 567.5 17.5Q496 64 442 158ZM850 561Q850 723 796 815Q742 907 647 907Q552 907 497 815Q442 723 442 561Q442 399 497 307Q552 215 647 215Q742 215 796 307Q850 399 850 561Z",
  "q": "M383 561Q383 399 437 307Q491 215 586 215Q681 215 736 307Q791 399 791 561Q791 723 736 815Q681 907 586 907Q491 907 437 815Q383 723 383 561ZM791 158Q737 64 665.5 17.5Q594 -29 504 -29Q305 -29 197.5 123Q90 275 90 559Q90 839 196 993Q302 1147 494 1147Q595 1147 669.5 1098Q744 1049 791 952V1120H1083V-426H791Z",
  "r": "M1151 811Q1103 855 1038.5 877Q974 899 897 899Q804 899 734.5 866.5Q665 834 627 772Q603 734 593.5 680Q584 626 584 516V0H291V1120H584V946Q627 1042 716 1094.5Q805 1147 924 1147Q984 1147 1041.5 1132.5Q1099 1118 1151 1090Z",
  "s": "M991 1085V829Q910 881 822.5 907.5Q735 934 647 934Q549 934 499 905.5Q449 877 449 821Q449 741 663 691L674 688L758 668Q918 630 992.5 545.5Q1067 461 1067 317Q1067 144 953.5 57.5Q840 -29 612 -29Q511 -29 405 -11.5Q299 6 190 41V297Q287 242 387.5 213Q488 184 582 184Q685 184 738 214Q791 244 791 301Q791 357 753.5 387Q716 417 575 451L494 469Q326 507 249 588Q172 669 172 805Q172 967 289 1057Q406 1147 618 1147Q713 1147 807.5 1131.5Q902 1116 991 1085Z",
  "t": "M690 1438V1120H1073V895H690V365Q690 290 726.5 257.5Q763 225 848 225H1073V0H827Q575 0 486 80.5Q397 161 397 379V895H111V1120H397V1438Z",
  "u": "M160 391V1120H453V436Q453 315 487 263Q521 211 600 211Q679 211 723.5 281Q768 351 768 477V1120H1061V0H768V166Q737 73 662.5 22Q588 -29 483 -29Q323 -29 241.5 77Q160 183 160 391Z",
  "v": "M1153 1120 797 0H436L80 1120H377L616 246L856 1120Z",
  "w": "M0 1120H244L377 262L498 827H735L854 262L989 1120H1233L1030 0H752L616 582L481 0H203Z",
  "x": "M1145 1120 768 584 1178 0H836L616 377L397 0H55L469 584L88 1120H430L616 786L803 1120Z",
  "y": "M711 -121Q652 -279 569.5 -351.5Q487 -424 369 -424H127V-201H246Q336 -201 378 -170.5Q420 -140 463 -29L485 31L59 1120H367L623 393L868 1120H1176Z",
  "z": "M186 1120H1081V891L492 219H1081V0H162V229L752 901H186Z",
  "{": "M1053 -143V-334H903Q654 -334 569.5 -260Q485 -186 485 35V250Q485 401 431.5 458.5Q378 516 238 516H176V707H238Q378 707 431.5 764Q485 821 485 973V1188Q485 1409 569.5 1482.5Q654 1556 903 1556H1053V1366H930Q826 1366 791 1324Q756 1282 756 1139V930Q756 765 707 698Q658 631 532 612Q658 591 707 523Q756 455 756 291V86Q756 -58 791 -100.5Q826 -143 930 -143Z",
  "|": "M729 1565V-483H502V1565Z",
  "}": "M180 -143H301Q405 -143 441 -100Q477 -57 477 86V291Q477 455 526 523Q575 591 700 612Q574 631 525.5 698Q477 765 477 930V1139Q477 1280 441.5 1323Q406 1366 301 1366H180V1556H330Q578 1556 661.5 1482.5Q745 1409 745 1188V973Q745 822 799.5 764.5Q854 707 995 707H1057V516H995Q854 516 799.5 458Q745 400 745 250V35Q745 -186 661.5 -260Q578 -334 330 -334H180Z",
  "~": "M1145 811V578Q1070 518 998.5 490.5Q927 463 848 463Q758 463 645 514Q623 524 612 528Q535 562 483.5 574Q432 586 381 586Q303 586 232.5 557Q162 528 88 465V694Q166 755 239 782Q312 809 395 809Q448 809 498 798Q548 787 622 756Q633 751 655 741Q771 686 864 686Q934 686 1003 716.5Q1072 747 1145 811Z",
  "\u2605": "M58 670H484L616 1075L749 670H1175L830 419L963 15L616 265L271 15L403 419Z",
  "\u2606": "M58 676H484L616 1080L749 676H1175L830 425L963 21L616 271L271 21L403 425ZM451 440 351 131 616 322 890 121 781 441 1065 640H720L616 952L516 640H169Z",
};
const LVL_UNITS_PER_EM = 2048;
const LVL_ADVANCE = 1233;

// Register the same embedded font for page UI (e.g. star filter buttons)
try {
  const dejavuUI = new FontFace('DejaVu Sans Mono', `url(${DEJAVU_MONO_B64})`);
  dejavuUI.load().then(f => document.fonts.add(f)).catch(() => {});
} catch (e) { /* older browsers */ }

function setRecordTitle(value) {
  currentTitle = value;
  localStorage.setItem('nrb-title', value);
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function setTitleFont(value) {
  const v = parseInt(value, 10);
  currentTitleFont = (v && v > 0) ? v : 36;
  localStorage.setItem('nrb-title-font', String(currentTitleFont));
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function setLvlFont(value) {
  const v = parseInt(value, 10);
  currentLvlFont = (v && v > 0) ? v : 16;
  localStorage.setItem('nrb-lvl-font', String(currentLvlFont));
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function openUserSettings() {
  const ov = document.getElementById('userSettingsOverlay');
  if (ov) ov.style.display = 'block';
}

function closeUserSettings() {
  const ov = document.getElementById('userSettingsOverlay');
  if (ov) ov.style.display = 'none';
}

function setShowTotalPots(value) {
  showTotalPots = !!value;
  localStorage.setItem('nrb-show-total-pots', showTotalPots ? 'true' : 'false');
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function setShowTotalPotsCount(value) {
  showTotalPotsCount = !!value;
  localStorage.setItem('nrb-show-total-pots-count', showTotalPotsCount ? 'true' : 'false');
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function setTotalPotsCountPrefix(value) {
  totalPotsCountPrefix = value || '';
  localStorage.setItem('nrb-total-pots-count-prefix', totalPotsCountPrefix);
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('recordTitle');
  if (input) input.value = currentTitle;
  const titleFontInput = document.getElementById('recordTitleFont');
  if (titleFontInput) titleFontInput.value = currentTitleFont;
  const lvlInput = document.getElementById('recordLvlFont');
  if (lvlInput) lvlInput.value = currentLvlFont;
  const totalPotsInput = document.getElementById('recordShowTotalPots');
  if (totalPotsInput) totalPotsInput.checked = showTotalPots;
  const totalPotsCountInput = document.getElementById('recordShowTotalPotsCount');
  if (totalPotsCountInput) totalPotsCountInput.checked = showTotalPotsCount;
  const totalPotsCountPrefixInput = document.getElementById('recordTotalPotsCountPrefix');
  if (totalPotsCountPrefixInput) totalPotsCountPrefixInput.value = totalPotsCountPrefix;
});

function populateThemeSelect() {
  const sel = document.getElementById('themeSelect');
  if (!sel) return;
  sel.innerHTML = '';
  for (const key of Object.keys(themes)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = themes[key].name;
    sel.appendChild(opt);
  }
  sel.value = currentThemeName;
}

function setTheme(name) {
  const resolved = resolveThemeName(name);
  if (!resolved) return;
  currentThemeName = resolved;
  localStorage.setItem('nrb-theme', resolved);
  const sel = document.getElementById('themeSelect');
  if (sel) sel.value = resolved;
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function prevTheme() {
  const keys = Object.keys(themes);
  const idx = keys.indexOf(currentThemeName);
  setTheme(keys[(idx - 1 + keys.length) % keys.length]);
}

function nextTheme() {
  const keys = Object.keys(themes);
  const idx = keys.indexOf(currentThemeName);
  setTheme(keys[(idx + 1) % keys.length]);
}

function hideRecordImage() {
  document.getElementById('recordImageOverlay').style.display = 'none';
  document.body.classList.remove('modal-open');
  if (typeof resetCanvasNotesMode === 'function') resetCanvasNotesMode();
}

function previewRecord() {
  const hasChar = selectedChars.some(c => c);
  const currentPotIds = new Set();
  selectedChars.filter(c => c).slice(0, 3).forEach(cId => {
    const cfg = charJson[cId]?.potential;
    if (!cfg) return;
    const isMain = selectedChars.filter(c => c).indexOf(cId) === 0;
    const coreKey = isMain ? 'mainCore' : 'supportCore';
    const normalKey = isMain ? 'mainNormal' : 'supportNormal';
    (cfg[coreKey] || []).forEach(p => currentPotIds.add(p.id));
    (cfg[normalKey] || []).forEach(p => currentPotIds.add(p.id));
    (cfg.common || []).forEach(p => currentPotIds.add(p.id));
  });
  const hasPot = [...currentPotIds].some(pid => (potLevels[pid] || 0) > 0);
  if (!hasChar || !hasPot) {
    showErrorToast('Select a character or potential first.');
    return;
  }
  renderRecordImage(packPotentials());
}

function renderRecordImage(b64, options = {}) {
  const returnSVG = !!options.returnSVG;
  _lastRecordPngBlob = null;
  let decoded;
  try {
    decoded = unpackPotentials(b64);
  } catch(e) {
    console.warn('Invalid record-image base64:', e.message);
    return;
  }

  const { charIds, potentials } = decoded;
  const validIds = charIds.filter(id => id !== 0);
  if (!validIds.length) return;

  // Include extra selected chars beyond the first 3
  const extraIds = selectedChars.filter(c => c).slice(3).map(id => +id).filter(id => !validIds.includes(id));

  // Merge potentials from base64 (first 3) with extras' levels from global state
  const mergedPots = { ...potentials };
  extraIds.forEach(cId => {
    const ch = charJson[cId];
    if (!ch?.potential) return;
    const allPotIds = [
      ...(ch.potential.mainCore || []).map(p => p.id),
      ...(ch.potential.mainNormal || []).map(p => p.id),
      ...(ch.potential.supportCore || []).map(p => p.id),
      ...(ch.potential.supportNormal || []).map(p => p.id),
      ...(ch.potential.common || []).map(p => p.id),
    ];
    allPotIds.forEach(pid => {
      const lvl = potLevels[pid];
      if (lvl > 0) mergedPots[pid] = lvl;
    });
  });

  const allCharIds = [...validIds, ...extraIds];
  const cfgMap = buildCfgMap(allCharIds.map(String));

  const theme = getTheme(currentThemeName);
  const sectionColors = theme.groups;
  const groupKeys = ['core', 'high', 'medium', 'low', 'optional'];

  const RP = 6, NW = 20, IG = 4, GG = 20;
  const PW = 120, PH = 153;
  const RH = PH + RP * 2, RG = 16;
  const SCL = 1.08, SW = Math.round(PW * SCL), SH = Math.round(PH * SCL), SO = Math.round(-(SW - PW) / 2);

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function vertText(x, y, str, color) {
    const title = str.replace(/\b\w/g, c => c.toUpperCase());
    return `<text transform="translate(${x},${y}) rotate(90)" text-anchor="start" dominant-baseline="hanging" font-size="20" font-weight="900" fill="${color}" font-family="DejaVu Sans, sans-serif">${esc(title)}</text>`;
  }
  // Level label (e.g. "6", "p6", "+4") drawn entirely from glyph outlines, so it
  // never depends on a font. Input is restricted to LVL_GLYPHS characters.
  function levelText(x, baselineY, text, color) {
    const chars = [...text].filter(c => LVL_GLYPHS[c]);
    if (!chars.length) return '';
    const scale = currentLvlFont / LVL_UNITS_PER_EM;
    const startX = x - (chars.length * LVL_ADVANCE * scale) / 2;
    const paths = chars.map((c, i) => i
      ? `<path transform="translate(${i * LVL_ADVANCE},0)" d="${LVL_GLYPHS[c]}"/>`
      : `<path d="${LVL_GLYPHS[c]}"/>`).join('');
    return `<g transform="translate(${startX.toFixed(3)},${baselineY}) scale(${scale.toFixed(6)},${(-scale).toFixed(6)})" fill="${color}">${paths}</g>`;
  }

  const rows = [];
  let maxRowW = 0;
  let totalPotCount = 0;

  const dividerH = 3;
  const extraGap = 12;

  allCharIds.forEach((charId, slot) => {
    if (!charId || !charJson[charId]) return;

    const ch = charJson[charId];
    const cfg = cfgMap[charId];
    if (!cfg) return;

    const isMain = slot === 0;
    const specKey = isMain ? 'MasterSpecificPotentialIds' : 'AssistSpecificPotentialIds';
    const normKey = isMain ? 'MasterNormalPotentialIds' : 'AssistNormalPotentialIds';
    const specIds = cfg[specKey] || [];
    const normIds = cfg[normKey] || [];
    const commIds = cfg.CommonPotentialIds || [];

    const allPots = [];
    [...specIds, ...normIds, ...commIds].forEach(pid => {
      const level = mergedPots[pid];
      if (level && level > 0) allPots.push({ id: pid, level });
    });
    if (!allPots.length) return;

    const groups = { core: [], high: [], medium: [], low: [], optional: [] };
    allPots.forEach(p => {
      const prio = priorityMap[String(p.id)];
      if (prio && groups[prio]) {
        groups[prio].push(p);
      } else if (p.level === 6 || p.level === 1) groups.core.push(p);
      else if (p.level >= 4) groups.high.push(p);
      else if (p.level >= 3) groups.medium.push(p);
      else groups.low.push(p);
    });

    if (potOrder[slot]) {
      for (const key of groupKeys) {
        const ord = potOrder[slot][key];
        if (ord && ord.length) {
          groups[key].sort((a, b) => {
            const oa = ord.indexOf(String(a.id));
            const ob = ord.indexOf(String(b.id));
            if (oa >= 0 && ob >= 0) return oa - ob;
            if (oa >= 0) return -1;
            if (ob >= 0) return 1;
            return 0;
          });
        }
      }
    }

    const variant = charHeadVariants[String(charId)] || '02';
    const customSrc = customHeadImages[String(charId)];
    const charImg = customSrc || headImageUrl(charId, variant);
    const name = charData[charId] || '';

    let x = 0;
    const elements = [];

    const pbW = RP + NW + IG + PW + RP;
    const potSum = allPots.reduce((s, p) => s + p.level, 0);
    totalPotCount += potSum;
    elements.push({ t: 'portrait', x, w: pbW, img: charImg, name, slot, charId, potSum });
    x += pbW;

    for (const key of groupKeys) {
      const items = groups[key];
      if (!items.length) continue;
      x += GG;
      const gw = RP + NW + IG + items.length * PW + (items.length - 1) * IG + RP;
      elements.push({ t: 'group', x, w: gw, key, items, color: sectionColors[key], slot });
      x += gw;
    }

    const ry = rows.length * (RH + RG);
    const yOff = (rows.length > 0 ? extraGap + dividerH : 0) + (rows.length >= 2 && allCharIds.length > 3 ? extraGap + dividerH : 0);
    rows.push({ elements, y: ry + yOff });
    maxRowW = Math.max(maxRowW, x);
  });

  if (!rows.length) {
    document.getElementById('recordImageContent').innerHTML = '<div style="color:#555;font-size:14px;">No characters to display</div>';
    return;
  }

  const sp = 10;
  const titleHasCount = showTotalPotsCount && totalPotCount > 0;
  const titleH = (currentTitle || titleHasCount) ? 64 : 0;
  const svgW = maxRowW + sp * 2;
  let svgH = titleH + rows.length * RH + (rows.length - 1) * RG + sp * 2;
  const dividerYs = [];
  if (rows.length > 1) {
    svgH += extraGap + dividerH;
    dividerYs.push(sp + RH + (RG + extraGap + dividerH) / 2 + titleH);
  }
  if (rows.length > 3) {
    svgH += extraGap + dividerH;
    dividerYs.push(sp + 2 * RH + RG + extraGap + dividerH + (RG + extraGap + dividerH) / 2 + titleH);
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;height:auto;display:block;">
<defs><clipPath id="c"><rect width="${PW}" height="${PH}" rx="4"/></clipPath><style>@font-face{font-family:'DejaVu Sans Mono';src:url('${DEJAVU_MONO_B64}')format('woff2');}.h-bdg{opacity:0;transition:opacity .12s}.h-ar:hover .h-bdg{opacity:1}.h-ar{cursor:pointer}</style></defs>
<rect width="${svgW}" height="${svgH}" fill="${theme.svgBg}"/>`;

  let titleText = '';
  if (titleHasCount) {
    titleText += (totalPotsCountPrefix ? totalPotsCountPrefix + ' ' : '') + totalPotCount;
    if (currentTitle) titleText += ' | ';
  }
  titleText += (currentTitle || '');
  if (titleText) {
    svg += `<text x="${sp + 20}" y="${titleH - 18}" font-size="${currentTitleFont}" font-weight="900" fill="${theme.titleColor}" font-family="DejaVu Sans, sans-serif">${esc(titleText)}</text>`;
  }

  const potPositions = [];
  for (const row of rows) {
    const ry = titleH + row.y + sp;
    for (const el of row.elements) {
      const ex = el.x + sp;
      if (el.t === 'portrait') {
        svg += `<rect x="${ex}" y="${ry}" width="${el.w}" height="${RH}" rx="4" fill="${theme.portrait[el.slot === 0 ? 0 : 1]}"/>`;
        svg += `<g class="h-ar" transform="translate(${ex+RP+NW+IG},${ry+RP})" clip-path="url(#c)"><image x="${SO}" y="${SO}" width="${SW}" height="${SH}" href="${esc(el.img)}" preserveAspectRatio="xMidYMid slice"/><g class="h-bdg" style="pointer-events:none"><rect x="0" y="0" width="${PW}" height="${PH}" fill="rgba(0,0,0,0.4)"/><circle cx="${PW/2}" cy="${PH/2}" r="16" fill="rgba(0,0,0,0.55)"/><g transform="translate(${PW/2},${PH/2}) rotate(-45)"><polygon points="-10,-4 -8,-4 4,-4 10,0 4,4 -8,4 -10,4" fill="#eee"/></g></g><rect x="0" y="0" width="${PW}" height="${PH}" fill="transparent" class="char-head-click" data-slot="${el.slot}" data-char-id="${el.charId}"/></g>`;
        svg += vertText(ex + RP + 19, ry + RP + 2, el.name, theme.titleColor);
        if (showTotalPots)
          svg += `<text x="${ex + RP - 1}" y="${ry + RH - 8}" font-size="16" font-family="'DejaVu Sans Mono', monospace" font-weight="bold" fill="${theme.titleColor}">${el.potSum || 0}</text>`;
      } else {
        svg += `<rect x="${ex}" y="${ry}" width="${el.w}" height="${RH}" rx="4" fill="${el.color}"/>`;
        svg += vertText(ex + RP + 19, ry + RP + 2, el.key, theme.titleColor);
        let ix = ex + RP + NW + IG;
        for (const p of el.items) {
          svg += `<g data-id="${p.id}" data-slot="${el.slot}" data-group="${el.key}" transform="translate(${ix},${ry+RP})"><rect width="${PW}" height="${PH}" fill="transparent"/><image x="0" y="0" width="${PW}" height="${PH}" href="${esc(BASE_ASSETS)}potential/${p.id}.webp" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)" style="pointer-events:none;user-select:none"/></g>`;
          if (!['01','02','03','04','21','22','23','24'].includes(String(p.id).slice(-2))) {
            const tg = potTagParts(p.id);
            svg += levelText(ix + 22, ry + RP + 12 + 0.25 * currentLvlFont, `${tg.pre}${p.level}${tg.post}`, '#568');
          }
          potPositions.push({ id: String(p.id), slot: el.slot, group: el.key, x: ix, y: ry + RP });
          ix += PW + IG;
        }
      }
    }
  }

  for (const dy of dividerYs) {
    svg += `<line x1="${sp}" y1="${dy}" x2="${sp + maxRowW}" y2="${dy}" stroke="${theme.dividerColor}" stroke-width="${dividerH}" stroke-linecap="round"/>`;
  }

  svg += `</svg>`;

  if (returnSVG) {
    if (typeof buildNotesSvgString === 'function') {
      const notes = buildNotesSvgString(svgW, svgH, potPositions);
      if (notes) svg = svg.replace(/<\/svg>\s*$/, notes + '</svg>');
    }
    return svg;
  }

  document.getElementById('recordImageContent').innerHTML = svg;
  populateThemeSelect();

  attachPotentialTooltips(document.querySelector('#recordImageContent svg'));

  enableSvgReorder();

  const finalSvg = document.querySelector('#recordImageContent svg');
  if (finalSvg) {
    renderCanvasNotes(finalSvg);
    attachCanvasNoteEvents(finalSvg);
  }

  attachHeadVariantClicks();

  document.getElementById('recordImageOverlay').style.display = 'block';
  document.body.classList.add('modal-open');
}

async function svgToPngBlob(svgSource) {
  let svgEl;
  if (typeof svgSource === 'string') {
    svgEl = new DOMParser().parseFromString(svgSource, 'image/svg+xml').documentElement;
  } else {
    svgEl = svgSource;
  }

  const clone = svgEl.cloneNode(true);

  const imgs = clone.querySelectorAll('image');
  let hadFailure = false;
  await Promise.all(Array.from(imgs).map(async el => {
    const href = el.getAttribute('href');
    if (!href || href.startsWith('data:')) return;
    const tryFetch = async (url) => {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const dataUrl = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });
      return dataUrl;
    };
    try {
      const dataUrl = await tryFetch(href);
      el.setAttribute('href', dataUrl);
    } catch (e) {
      // Fallback: if local heads 404, try remote ssassets
      const m = href.match(/data\/heads\/head_(\d+)(\d{2})_XL\.webp/);
      if (m) {
        const fallback = headImageFallbackUrl(m[1], m[2]);
        try {
          const dataUrl2 = await tryFetch(fallback);
          el.setAttribute('href', dataUrl2);
          return;
        } catch (e2) { console.warn('PNG embed fallback failed:', href, '->', fallback, e2); }
      }
      console.warn('PNG embed failed:', href, e); hadFailure = true; el.remove();
    }
  }));

  const styles = clone.querySelectorAll('style');
  for (const el of styles) {
    const text = el.textContent;
    const urlMatch = text.match(/url\(['"]?([^'"()]+)['"]?\)/);
    if (urlMatch && !urlMatch[1].startsWith('data:')) {
      try {
        const resp = await fetch(urlMatch[1]);
        if (resp.ok) {
          const blob = await resp.blob();
          const dataUrl = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });
          el.textContent = text.replace(urlMatch[1], dataUrl);
        }
      } catch (e) { console.warn('Font embed failed:', urlMatch[1], e); }
    }
  }

  if (hadFailure) showToast('Some images failed to load');

  const inlinedSvgString = new XMLSerializer().serializeToString(clone);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const blob = new Blob([inlinedSvgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const scale = 2;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(pngBlob => resolve({ pngBlob, svgString: inlinedSvgString }));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('PNG conversion failed')); };
    img.src = url;
  });
}

async function downloadRecordPNG() {
  const svgEl = document.querySelector('#recordImageContent svg');
  if (!svgEl) return;
  try {
    const { pngBlob } = await svgToPngBlob(svgEl);
    const pngUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'record-preview.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(pngUrl);
  } catch (e) { alert('PNG export failed.'); }
}

async function copyRecordPNG() {
  let blob = _lastRecordPngBlob;
  if (!blob) {
    const svgEl = document.querySelector('#recordImageContent svg');
    if (!svgEl) return;
    try {
      const result = await svgToPngBlob(svgEl);
      blob = result.pngBlob;
    } catch (e) { showToast('Copy failed'); return; }
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showToast('Copied');
  } catch (e) { showToast('Copy failed'); }
}

function buildRecordUrl() {
  const b64 = packPotentials();
  const allChars = selectedChars.filter(c => c);
  const chars = allChars.slice(0, 3);
  const extras = allChars.slice(3);
  const cfgMap = buildCfgMap(chars);
  const keys = ['core', 'high', 'medium', 'low', 'optional'];
  const slotStrs = [];
  const buildPrioSlot = (cId) => {
    const cfg = buildCfgMap([cId])[+cId];
    if (!cfg) return '';
    const allIds = [...(cfg.MasterSpecificPotentialIds||[]), ...(cfg.MasterNormalPotentialIds||[]),
                     ...(cfg.AssistSpecificPotentialIds||[]), ...(cfg.AssistNormalPotentialIds||[]),
                     ...(cfg.CommonPotentialIds||[])];
    const byPrio = {};
    allIds.forEach(fullId => {
      if (priorityMap[fullId]) {
        const short = String(fullId).slice(-2);
        (byPrio[priorityMap[fullId]] || (byPrio[priorityMap[fullId]] = [])).push(short);
      }
    });
    return keys.map(k => (byPrio[k] || []).join('.')).join('-');
  };
  chars.forEach(cId => slotStrs.push(buildPrioSlot(cId)));
  extras.forEach(cId => slotStrs.push(buildPrioSlot(cId)));
  const base = window.location.protocol + '//' + window.location.host + window.location.pathname;
  let url = base + '?png=' + encodeURIComponent(b64);
  const prioStr = slotStrs.join('_');
  if (prioStr.replace(/-/g, '')) url += '&p=' + encodeURIComponent(prioStr);
  if (currentTitle) url += '&t=' + encodeURIComponent(currentTitle);
  url += '&h=' + encodeURIComponent(currentThemeName);

  if (extras.length) {
    url += '&b=' + encodeURIComponent(packPotLevels(extras));
  }

  const groupKeys = ['core', 'high', 'medium', 'low', 'optional'];
  const orderParts = [];
  chars.forEach((cId, slot) => {
    if (!potOrder[slot]) { orderParts.push(''); return; }
    const encoded = groupKeys.map(key => {
      const ids = potOrder[slot][key];
      if (!ids || !ids.length) return '';
      const validIds = ids.filter(id => {
        const level = potLevels[+id] || 0;
        return level > 0 && getPotPriority(id, level) === key;
      });
      if (!validIds.length) return '';
      return validIds.map(id => String(id).slice(-2)).join('');
    }).join('-');
    orderParts.push(encoded);
  });
  const orderStr = orderParts.join('_');
  if (orderStr.replace(/_/g, '')) url += '&o=' + encodeURIComponent(orderStr);

  const tagsStr = typeof encodePotTagsParam === 'function' ? encodePotTagsParam() : '';
  if (tagsStr) url += '&l=' + encodeURIComponent(tagsStr);

  const notesStr = typeof encodeCanvasNotesToParam === 'function' ? encodeCanvasNotesToParam() : '';
  if (notesStr) url += '&n=' + encodeURIComponent(notesStr);

  const variantParts = [];
  allChars.forEach(cId => {
    const v = charHeadVariants[String(cId)] || '02';
    variantParts.push(v);
  });
  const anyCustom = variantParts.some(v => v !== '02');
  if (anyCustom) {
    const first3 = variantParts.slice(0, 3).join('-');
    if (extras.length) {
      const extraVariants = variantParts.slice(3).join('-');
      url += '&v=' + encodeURIComponent(first3 + '_' + extraVariants);
    } else {
      url += '&v=' + encodeURIComponent(first3);
    }
  }

  return url;
}

function openRecordPNG() {
  if (Object.keys(customHeadImages).length > 0) {
    showConfirmModal(
      'Custom character images won\u2019t render in the PNG view. Use \u2018Copy PNG\u2019 inside the preview instead.',
      () => { window.location.href = buildRecordUrl(); }
    );
    return;
  }
  window.location.href = buildRecordUrl();
}

function copyRecordLink() {
  const url = buildRecordUrl();
  navigator.clipboard.writeText(url).then(() => {
    showToast('Copied');
  }).catch(() => {});
}

function getPotPriority(potId, level) {
  const p = priorityMap[String(potId)];
  if (p && ['core','high','medium','low','optional'].includes(p)) return p;
  if (level === 6 || level === 1) return 'core';
  if (level >= 4) return 'high';
  if (level >= 3) return 'medium';
  return 'low';
}

function getCurrentGroupOrder(slot, group) {
  const charId = selectedChars[slot];
  if (!charId) return [];
  const cfgMap = buildCfgMap([String(charId)]);
  const cfg = cfgMap[Number(charId)];
  if (!cfg) return [];
  const isMain = slot === 0;
  const specKey = isMain ? 'MasterSpecificPotentialIds' : 'AssistSpecificPotentialIds';
  const normKey = isMain ? 'MasterNormalPotentialIds' : 'AssistNormalPotentialIds';
  const ids = [...(cfg[specKey]||[]), ...(cfg[normKey]||[]), ...(cfg.CommonPotentialIds||[])];
  const pots = ids.filter(pid => (potLevels[pid] || 0) > 0).map(pid => ({ id: pid, level: potLevels[pid] }));
  return pots.filter(p => getPotPriority(p.id, p.level) === group).map(p => String(p.id));
}

function getOrBuildGroupOrder(slot, group) {
  if (!potOrder[slot]) potOrder[slot] = {};
  const arr = potOrder[slot][group];
  if (arr) {
    for (const id of getCurrentGroupOrder(slot, group)) {
      if (!arr.includes(id)) arr.push(id);
    }
    return arr;
  }
  const fresh = getCurrentGroupOrder(slot, group);
  potOrder[slot][group] = [...fresh];
  return potOrder[slot][group];
}

function resetPotOrder() {
  potOrder = {};
  saveState();
  renderRecordImage(packPotentials());
}

function enableSvgReorder() {
  const svg = document.querySelector('#recordImageContent svg');
  if (!svg) return;
  svg.querySelectorAll('g[data-id]').forEach(el => {
    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onSvgPotMouseDown);
  });
}

let _svgDrag = null;
let _lastStateKey = null;
let _dragActive = false;

function clearSvgDragTargets() {
  document.querySelectorAll('g[data-id]').forEach(el => {
    el.classList.remove('svg-drag-src');
    el.style.cursor = 'grab';
  });
}

function onSvgPotMouseDown(e) {
  if (e.button !== 0) return;
  const g = e.currentTarget;
  if (!g) return;
  _svgDrag = {
    el: g,
    id: g.getAttribute('data-id'),
    slot: g.getAttribute('data-slot'),
    group: g.getAttribute('data-group')
  };
  _lastStateKey = null;
  _dragActive = true;
  const tt = document.querySelector('.pot-tooltip');
  if (tt) tt.style.display = 'none';
  g.classList.add('svg-drag-src');
  document.addEventListener('mousemove', onSvgDragMove);
  document.addEventListener('mouseup', onSvgDragEnd);
  e.preventDefault();
}

function onSvgDragMove(e) {
  if (!_svgDrag) return;
  e.preventDefault();
  const raw = document.elementFromPoint(e.clientX, e.clientY);
  if (!raw) return;
  const g = raw.closest('g[data-id]');
  if (!g) return;
  if (g.getAttribute('data-slot') !== _svgDrag.slot) return;

  const targetId = g.getAttribute('data-id');
  const targetGroup = g.getAttribute('data-group');
  if (targetId === _svgDrag.id) return;

  const rect = g.getBoundingClientRect();
  const insertBefore = e.clientX < rect.left + rect.width / 2;

  const slot = parseInt(_svgDrag.slot);
  const sourceGroup = _svgDrag.group;
  const draggedId = _svgDrag.id;

  if (targetGroup !== sourceGroup) {
    _lastStateKey = null;
    priorityMap[draggedId] = targetGroup;

    if (!potOrder[slot]) potOrder[slot] = {};
    if (potOrder[slot][sourceGroup]) {
      const idx = potOrder[slot][sourceGroup].indexOf(draggedId);
      if (idx !== -1) potOrder[slot][sourceGroup].splice(idx, 1);
      if (!potOrder[slot][sourceGroup].length) delete potOrder[slot][sourceGroup];
    }

    const tgtArr = getOrBuildGroupOrder(slot, targetGroup);
    const curIdx = tgtArr.indexOf(draggedId);
    if (curIdx !== -1) tgtArr.splice(curIdx, 1);

    const toIdx = tgtArr.indexOf(targetId);
    if (toIdx !== -1) {
      tgtArr.splice(insertBefore ? toIdx : toIdx + 1, 0, draggedId);
    } else {
      tgtArr.push(draggedId);
    }

    _svgDrag.group = targetGroup;
    _svgDrag.slot = String(slot);
    saveState();
    renderRecordImage(packPotentials());
    _svgDrag.el = document.querySelector(`#recordImageContent g[data-slot="${_svgDrag.slot}"][data-id="${_svgDrag.id}"]`);
    if (_svgDrag.el) { _svgDrag.el.classList.add('svg-drag-src'); _svgDrag.el.style.cursor = 'grabbing'; }
    return;
  }

  const stateKey = targetId + (insertBefore ? '<' : '>');
  if (stateKey === _lastStateKey) return;
  _lastStateKey = stateKey;

  const group = sourceGroup;

  const arr = getOrBuildGroupOrder(slot, group);
  const fromIdx = arr.indexOf(draggedId);
  const toIdx = arr.indexOf(targetId);
  if (toIdx === -1) return;
  if (fromIdx === -1) {
    arr.push(draggedId);
    const newFromIdx = arr.indexOf(draggedId);
    arr.splice(newFromIdx, 1);
    const newToIdx = arr.indexOf(targetId);
    arr.splice(insertBefore ? newToIdx : newToIdx + 1, 0, draggedId);
    renderRecordImage(packPotentials());
    _svgDrag.el = document.querySelector(`g[data-id="${_svgDrag.id}"]`);
    if (_svgDrag.el) { _svgDrag.el.classList.add('svg-drag-src'); _svgDrag.el.style.cursor = 'grabbing'; }
    return;
  }

  arr.splice(fromIdx, 1);
  const newToIdx = arr.indexOf(targetId);
  arr.splice(insertBefore ? newToIdx : newToIdx + 1, 0, draggedId);

  renderRecordImage(packPotentials());

  _svgDrag.el = document.querySelector(`#recordImageContent g[data-slot="${_svgDrag.slot}"][data-id="${_svgDrag.id}"]`);
  if (_svgDrag.el) {
    _svgDrag.el.classList.add('svg-drag-src');
    _svgDrag.el.style.cursor = 'grabbing';
  }
}

function onSvgDragEnd() {
  document.removeEventListener('mousemove', onSvgDragMove);
  document.removeEventListener('mouseup', onSvgDragEnd);
  _lastStateKey = null;
  if (!_svgDrag) { clearSvgDragTargets(); return; }

  _dragActive = false;
  clearSvgDragTargets();
  saveState();
  _svgDrag = null;
}

function resolveOrderFromParam(orderStr) {
  if (!orderStr) return;
  potOrder = {};
  const chars = selectedChars.filter(c => c);
  if (!chars.length) return;
  const cfgMap = buildCfgMap(chars);
  const groupKeys = ['core', 'high', 'medium', 'low', 'optional'];

  orderStr.split('_').forEach((slotStr, slot) => {
    if (!slotStr) return;
    const parts = slotStr.split('-');
    const charId = selectedChars[slot];
    if (!charId || !cfgMap[+charId]) return;
    const cfg = cfgMap[+charId];
    const isMain = slot === 0;
    const specKey = isMain ? 'MasterSpecificPotentialIds' : 'AssistSpecificPotentialIds';
    const normKey = isMain ? 'MasterNormalPotentialIds' : 'AssistNormalPotentialIds';
    const allFullIds = [...(cfg[specKey]||[]), ...(cfg[normKey]||[]), ...(cfg.CommonPotentialIds||[])];

    const shortToFull = {};
    allFullIds.forEach(fid => { shortToFull[String(fid).slice(-2)] = fid; });

    const orders = {};
    const corrupted = {};
    parts.forEach((part, i) => {
      if (i >= groupKeys.length) return;
      const key = groupKeys[i];
      if (!part) { corrupted[key] = false; return; }
      const seen = new Set();
      const fullIds = [];
      let rawCount = 0;
      for (let j = 0; j < part.length; j += 2) {
        const short = part.slice(j, j + 2);
        if (short.length === 2 && shortToFull[short]) {
          rawCount++;
          if (!seen.has(short)) {
            seen.add(short);
            fullIds.push(String(shortToFull[short]));
          }
        }
      }
      corrupted[key] = rawCount > seen.size;
      if (fullIds.length) orders[key] = fullIds;
    });

    groupKeys.forEach(key => {
      if (!orders[key]) return;
      const natural = getCurrentGroupOrder(slot, key);
      const naturalSet = new Set(natural);
      const hasForeign = orders[key].some(id => !naturalSet.has(id));
      let cleaned;
      if (corrupted[key] || hasForeign) {
        cleaned = natural;
      } else {
        cleaned = orders[key].filter(id => naturalSet.has(id));
        natural.forEach(id => { if (!cleaned.includes(id)) cleaned.push(id); });
      }
      if (cleaned.length) orders[key] = cleaned;
      else delete orders[key];
    });

    if (Object.keys(orders).length) potOrder[slot] = orders;
  });
}

function attachPotentialTooltips(container) {
  if (window.matchMedia('(max-width: 600px)').matches) return;
  let tt = document.querySelector('.pot-tooltip');
  if (!tt) {
    tt = document.createElement('div');
    tt.className = 'pot-tooltip';
    tt.style.display = 'none';
    document.body.appendChild(tt);
  }
  if (!container) return;
  container.querySelectorAll('[data-id]').forEach(el => {
    let moveHandler = null;
    const pid = el.getAttribute('data-id');
    el.addEventListener('mouseenter', e => {
      if (_dragActive) return;
      const tooltip = document.querySelector('.pot-tooltip');
      if (!tooltip) return;
      let def = null;
      for (const key of Object.keys(charJson)) {
        const c = charJson[key];
        if (!c?.potential) continue;
        for (const pk of ['mainCore','mainNormal','supportCore','supportNormal','common']) {
          const arr = c.potential[pk];
          if (!Array.isArray(arr)) continue;
          const found = arr.find(p => String(p.id) === pid);
          if (found) { def = found; break; }
        }
        if (def) break;
      }
      let bigImg = tooltip.querySelector('img');
      if (!bigImg) {
        bigImg = document.createElement('img');
        tooltip.insertBefore(bigImg, tooltip.firstChild);
      }
      bigImg.src = BASE_ASSETS + `potential/${pid}.webp`;
      let descDiv = tooltip.querySelector('.desc');
      if (!descDiv) {
        descDiv = document.createElement('div');
        descDiv.className = 'desc';
        tooltip.appendChild(descDiv);
      }
      let rawDesc = def ? formatPotentialDesc(pid, def.params) : 'No description available.';
      if (!rawDesc || rawDesc === 'No description available.') rawDesc = 'No detailed description found.';
      rawDesc = formatDescriptionWithColor(rawDesc);
      descDiv.innerHTML = rawDesc;
      tooltip.style.display = 'flex';
      const updatePos = ev => { tooltip.style.left = (ev.clientX + 15) + 'px'; tooltip.style.top = (ev.clientY + 15) + 'px'; };
      updatePos(e);
      window.addEventListener('mousemove', updatePos);
      moveHandler = updatePos;
    });
    el.addEventListener('mouseleave', () => {
      const tooltip = document.querySelector('.pot-tooltip');
      if (tooltip) tooltip.style.display = 'none';
      if (moveHandler) { window.removeEventListener('mousemove', moveHandler); moveHandler = null; }
    });
  });
}

function enablePngHover(pngImg) {
  const svgEl = document.querySelector('#recordImageContent svg');
  if (!svgEl || !pngImg) return;

  let tt = document.querySelector('.pot-tooltip');
  if (!tt) {
    tt = document.createElement('div');
    tt.className = 'pot-tooltip';
    tt.style.display = 'none';
    document.body.appendChild(tt);
  }

  const vb = svgEl.getAttribute('viewBox').split(' ').map(Number);
  const svgW = vb[2], svgH = vb[3];
  const PW = 120, PH = 153;

  const pots = [];
  svgEl.querySelectorAll('[data-id]').forEach(el => {
    const pid = el.getAttribute('data-id');
    const t = el.getAttribute('transform');
    const m = t?.match(/translate\(([^,]+),([^)]+)\)/);
    if (!m) return;
    pots.push({ id: pid, x: parseFloat(m[1]), y: parseFloat(m[2]) });
  });
  if (!pots.length) return;

  let currentPid = null;

  pngImg.addEventListener('mousemove', e => {
    const rect = pngImg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (svgW / rect.width);
    const my = (e.clientY - rect.top) * (svgH / rect.height);

    const hit = pots.find(p => mx >= p.x && mx < p.x + PW && my >= p.y && my < p.y + PH);

    const tooltip = document.querySelector('.pot-tooltip');
    if (!tooltip) return;

    if (hit) {
      if (hit.id !== currentPid) {
        currentPid = hit.id;
        let def = null;
        for (const key of Object.keys(charJson)) {
          const c = charJson[key];
          if (!c?.potential) continue;
          for (const pk of ['mainCore','mainNormal','supportCore','supportNormal','common']) {
            const arr = c.potential[pk];
            if (!Array.isArray(arr)) continue;
            const found = arr.find(p => String(p.id) === hit.id);
            if (found) { def = found; break; }
          }
          if (def) break;
        }
        let bigImg = tooltip.querySelector('img');
        if (!bigImg) {
          bigImg = document.createElement('img');
          tooltip.insertBefore(bigImg, tooltip.firstChild);
        }
        const imgEl = svgEl.querySelector(`g[data-id="${hit.id}"] image`);
        bigImg.src = imgEl ? imgEl.getAttribute('href') : BASE_ASSETS + `potential/${hit.id}.webp`;
        let descDiv = tooltip.querySelector('.desc');
        if (!descDiv) {
          descDiv = document.createElement('div');
          descDiv.className = 'desc';
          tooltip.appendChild(descDiv);
        }
        let rawDesc = def ? formatPotentialDesc(hit.id, def.params) : 'No description available.';
        if (!rawDesc || rawDesc === 'No description available.') rawDesc = 'No detailed description found.';
        rawDesc = formatDescriptionWithColor(rawDesc);
        descDiv.innerHTML = rawDesc;
        tooltip.style.display = 'flex';
      }
      tooltip.style.left = (e.clientX + 15) + 'px';
      tooltip.style.top = (e.clientY + 15) + 'px';
    } else if (currentPid) {
      currentPid = null;
      tooltip.style.display = 'none';
    }
  });

  pngImg.addEventListener('mouseleave', () => {
    currentPid = null;
    const tooltip = document.querySelector('.pot-tooltip');
    if (tooltip) tooltip.style.display = 'none';
  });
}

function applyBonusUnitsData(b64) {
  if (!b64) return;
  try {
    const { charIds, potentials } = unpackPotLevels(b64);
    const validIds = charIds.filter(id => id !== 0).map(String).filter(id => charData[id]);
    validIds.forEach(id => {
      if (!selectedChars.includes(id)) selectedChars.push(id);
    });
    Object.entries(potentials).forEach(([pid, lvl]) => { potLevels[+pid] = lvl; });
  } catch(e) {
    console.warn('Failed to apply bonus units:', e.message);
  }
}

const HEAD_VARIANTS_CACHE = {};

function imageExists(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function getAvailableHeadVariants(charId) {
  if (HEAD_VARIANTS_CACHE[charId]) return HEAD_VARIANTS_CACHE[charId];
  // Prefer local manifest (fast, no network flood) — falls back to probing
  try {
    const manifest = await loadHeadManifest();
    if (manifest && manifest[String(charId)] && manifest[String(charId)].length) {
      HEAD_VARIANTS_CACHE[charId] = manifest[String(charId)];
      return HEAD_VARIANTS_CACHE[charId];
    }
  } catch {}
  const available = [];
  for (let i = 1; i <= 20; i++) {
    const v = String(i).padStart(2, '0');
    // Try local trimmed image first, fall back to remote if not yet cached
    const localUrl = headImageUrl(charId, v);
    let exists = await imageExists(localUrl);
    if (!exists) exists = await imageExists(headImageFallbackUrl(charId, v));
    if (exists) {
      available.push(v);
    } else {
      break;
    }
  }
  HEAD_VARIANTS_CACHE[charId] = available.length > 0 ? available : ['01'];
  return HEAD_VARIANTS_CACHE[charId];
}

function showHeadVariantMenu(charId, slot, clickX, clickY) {
  let menu = document.querySelector('.head-variant-menu');
  if (menu) menu.remove();

  menu = document.createElement('div');
  menu.className = 'head-variant-menu';
  menu.style.cssText = `position:fixed;z-index:100001;background:#1e1e1e;border:1px solid #555;border-radius:6px;padding:8px;box-shadow:0 6px 20px rgba(0,0,0,0.7);display:flex;gap:6px;`;

  const loading = document.createElement('div');
  loading.textContent = 'Loading...';
  loading.style.cssText = 'color:#888;font-size:12px;padding:8px 12px;';
  menu.appendChild(loading);
  menu.style.left = Math.min(clickX, window.innerWidth - 200) + 'px';
  menu.style.top = Math.min(clickY, window.innerHeight - 100) + 'px';
  document.body.appendChild(menu);

  getAvailableHeadVariants(charId).then(variants => {
    menu.innerHTML = '';

    const uploadOpt = document.createElement('div');
    uploadOpt.style.cssText = 'cursor:pointer;border-radius:4px;overflow:hidden;border:2px dashed #555;display:flex;flex-direction:column;align-items:center;gap:2px;padding:2px;';

    const uploadWrap = document.createElement('div');
    uploadWrap.style.cssText = 'width:72px;height:92px;display:flex;align-items:center;justify-content:center;border-radius:2px;background:#2a2a2a;';

    const plusIcon = document.createElement('span');
    plusIcon.textContent = '+';
    plusIcon.style.cssText = 'font-size:28px;color:#666;line-height:1;';

    const uploadLbl = document.createElement('div');
    uploadLbl.textContent = 'Custom';
    uploadLbl.style.cssText = 'font-size:10px;color:#888;text-align:center;';

    uploadWrap.appendChild(plusIcon);
    uploadOpt.appendChild(uploadWrap);
    uploadOpt.appendChild(uploadLbl);

    uploadOpt.onclick = () => {
      menu.remove();
      showCropModal(charId, slot);
    };

    menu.appendChild(uploadOpt);

    variants.forEach(v => {
      const opt = document.createElement('div');
      opt.style.cssText = 'cursor:pointer;border-radius:4px;overflow:hidden;border:2px solid transparent;display:flex;flex-direction:column;align-items:center;gap:2px;padding:2px;';

      const wrap = document.createElement('div');
      wrap.style.cssText = 'width:72px;height:92px;overflow:hidden;border-radius:2px;background:#2a2a2a;';

      const img = document.createElement('img');
      img.src = headImageUrl(charId, v);
      img.onerror = () => { img.onerror = null; img.src = headImageFallbackUrl(charId, v); };
      img.style.cssText = 'width:100%;height:100%;display:block;object-fit:cover;';
      img.loading = 'lazy';

      const lbl = document.createElement('div');
      lbl.textContent = v;
      lbl.style.cssText = 'font-size:10px;color:#888;text-align:center;';

      wrap.appendChild(img);
      opt.appendChild(wrap);
      opt.appendChild(lbl);

      const current = charHeadVariants[String(charId)] || '02';

      opt.onclick = () => {
        setHeadVariant(charId, slot, v);
        menu.remove();
      };

      menu.appendChild(opt);
    });
  });
}

function setHeadVariant(charId, slot, variant) {
  charHeadVariants[String(charId)] = variant;
  saveState();
  renderRecordImage(packPotentials());
}

function attachHeadVariantClicks() {
  const svg = document.querySelector('#recordImageContent svg');
  if (!svg) return;
  svg.querySelectorAll('.char-head-click').forEach(el => {
    el.addEventListener('click', e => {
      const charId = el.getAttribute('data-char-id');
      const slot = el.getAttribute('data-slot');
      const rect = svg.getBoundingClientRect();
      showHeadVariantMenu(charId, slot, e.clientX, e.clientY);
    });
  });
}

function parseHeadVariantsParam(str) {
  if (!str) return;
  const allChars = selectedChars.filter(c => c);
  const parts = str.split('_');
  const first3 = parts[0] ? parts[0].split('-') : [];
  const extras = parts[1] ? parts[1].split('-') : [];
  const all = [...first3, ...extras];
  all.forEach((v, i) => {
    if (i < allChars.length && v.match(/^\d{2}$/)) {
      charHeadVariants[String(allChars[i])] = v;
    }
  });
}

function checkRecordImageParam() {
  const params = new URLSearchParams(window.location.search.replace(/\+/g, '%2B'));
  const orderParam = params.get('o') ?? params.get('order');
  const preview = params.get('r') ?? params.get('record-preview');
  const png = params.get('png') ?? params.get('record-png');
  const image = params.get('record-image') || png;
  const bonusData = params.get('b') ?? params.get('bonus-data');
  const titleParam = params.get('t') ?? params.get('title');
  const themeParam = params.get('h') ?? params.get('theme');
  const notesParam = params.get('n') ?? params.get('notes');
  const variantParam = params.get('v') ?? params.get('variants');
  const tagsParam = params.get('l') ?? params.get('levels');
  if (preview || image) {
    currentTitle = '';
    currentThemeName = 'dark';
    if (typeof clearCanvasNotes === 'function') clearCanvasNotes();
    if (titleParam) {
      currentTitle = titleParam;
      localStorage.setItem('nrb-title', currentTitle);
    }
    if (themeParam) {
      const resolved = resolveThemeName(themeParam);
      if (resolved) currentThemeName = resolved;
    }
    if (notesParam && typeof decodeCanvasNotesFromParam === 'function') {
      decodeCanvasNotesFromParam(notesParam);
    }
  }
  if (preview) {
    document.getElementById('importInput').value = preview;
    importPotentials();
    applyBonusUnitsData(bonusData);
    applyPendingPrios();
    if (orderParam) resolveOrderFromParam(orderParam);
    if (variantParam) parseHeadVariantsParam(variantParam);
    if (tagsParam) parsePotTagsParam(tagsParam);
    renderRecordImage(preview);
    generate();
    refreshCharBadges();
    updatePotentials();
  }
  if (image) {
    previewMode = true;
    document.getElementById('importInput').value = image;
    importPotentials();
    applyBonusUnitsData(bonusData);
    applyPendingPrios();
    if (orderParam) resolveOrderFromParam(orderParam);
    if (variantParam) parseHeadVariantsParam(variantParam);
    if (tagsParam) parsePotTagsParam(tagsParam);
    renderRecordImage(image);
    setTimeout(() => downloadRecordPNG(), 500);
  }

  const titleInput = document.getElementById('recordTitle');
  if (titleInput) titleInput.value = currentTitle;

  const titleFontInput2 = document.getElementById('recordTitleFont');
  if (titleFontInput2) titleFontInput2.value = currentTitleFont;

  const lvlFontInput = document.getElementById('recordLvlFont');
  if (lvlFontInput) lvlFontInput.value = currentLvlFont;

  if (bonusData || preview || image) {
    history.replaceState(null, '', window.location.pathname);
  }
}

function showCropModal(charId, slot) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => buildCropUI(charId, slot, reader.result);
    reader.readAsDataURL(file);
  };
  document.body.appendChild(input);
  input.click();
  input.remove();
}

function buildCropUI(charId, slot, dataUrl) {
  let scale = 1, tx = 0, ty = 0;
  const cropW = 240, cropH = 306;
  const vpW = 360, vpH = 459;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;';

  const panel = document.createElement('div');
  panel.style.cssText = 'background:#1e1e1e;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;';

  const title = document.createElement('div');
  title.textContent = 'Crop Head Image';
  title.style.cssText = 'font-size:14px;font-weight:bold;color:#ccc;padding:14px 16px 0;';

  const viewport = document.createElement('div');
  viewport.style.cssText = `position:relative;width:${vpW}px;height:${vpH}px;overflow:hidden;background:#222;margin:12px 16px;border-radius:4px;cursor:grab;`;

  const img = new Image();
  img.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;user-select:none;pointer-events:none;-webkit-user-drag:none;';
  img.draggable = false;

  const mask = document.createElement('div');
  mask.style.cssText = `position:absolute;width:${cropW}px;height:${cropH}px;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 9999px rgba(0,0,0,0.6);pointer-events:none;z-index:2;`;

  const frame = document.createElement('div');
  frame.style.cssText = `position:absolute;width:${cropW}px;height:${cropH}px;left:50%;top:50%;transform:translate(-50%,-50%);border:2px solid #fff;pointer-events:none;z-index:3;box-sizing:border-box;border-radius:2px;`;

  viewport.appendChild(img);
  viewport.appendChild(mask);
  viewport.appendChild(frame);

  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex;align-items:center;gap:10px;padding:0 16px 8px;';

  const zoomLabel = document.createElement('span');
  zoomLabel.textContent = 'Zoom';
  zoomLabel.style.cssText = 'color:#aaa;font-size:12px;';

  const zoomSlider = document.createElement('input');
  zoomSlider.type = 'range';
  zoomSlider.min = '10';
  zoomSlider.max = '500';
  zoomSlider.step = '1';
  zoomSlider.style.cssText = 'flex:1;accent-color:#4a8;';

  const zoomVal = document.createElement('span');
  zoomVal.style.cssText = 'color:#aaa;font-size:12px;width:50px;text-align:right;font-variant-numeric:tabular-nums;';

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;padding:0 16px 12px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = 'padding:6px 16px;border:1px solid #555;border-radius:4px;background:#333;color:#ccc;cursor:pointer;font-size:12px;';
  cancelBtn.onclick = () => { cleanup(); overlay.remove(); };

  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply';
  applyBtn.style.cssText = 'padding:6px 16px;border:none;border-radius:4px;background:#4a8;color:#fff;cursor:pointer;font-size:12px;font-weight:bold;';

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(applyBtn);
  controls.appendChild(zoomLabel);
  controls.appendChild(zoomSlider);
  controls.appendChild(zoomVal);
  panel.appendChild(title);
  panel.appendChild(viewport);
  panel.appendChild(controls);
  panel.appendChild(btnRow);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  let isDragging = false;
  let dragStartX, dragStartY, startTx, startTy;

  function update() {
    const dw = Math.round(img.naturalWidth * scale);
    const dh = Math.round(img.naturalHeight * scale);
    img.style.width = dw + 'px';
    img.style.height = dh + 'px';
    img.style.transform = `translate(${tx}px, ${ty}px)`;
    zoomSlider.value = String(Math.round(scale * 100));
    zoomVal.textContent = Math.round(scale * 100) + '%';
  }

  function centerImage() {
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    tx = (vpW - dw) / 2;
    ty = (vpH - dh) / 2;
    update();
  }

  img.onload = () => {
    const sx = vpW / img.naturalWidth;
    const sy = vpH / img.naturalHeight;
    scale = Math.min(sx, sy);
    centerImage();
  };
  img.src = dataUrl;

  zoomSlider.oninput = () => {
    const newScale = parseFloat(zoomSlider.value) / 100;
    const ratio = newScale / scale;
    const cx = vpW / 2, cy = vpH / 2;
    tx = cx - (cx - tx) * ratio;
    ty = cy - (cy - ty) * ratio;
    scale = newScale;
    update();
  };

  viewport.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startTx = tx;
    startTy = ty;
    viewport.style.cursor = 'grabbing';
    e.preventDefault();
  });

  function onMove(e) {
    if (!isDragging) return;
    tx = startTx + (e.clientX - dragStartX);
    ty = startTy + (e.clientY - dragStartY);
    update();
  }

  function onUp() {
    if (!isDragging) return;
    isDragging = false;
    viewport.style.cursor = 'grab';
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(5, Math.max(0.1, scale * delta));
    const ratio = newScale / scale;
    const cx = vpW / 2, cy = vpH / 2;
    tx = cx - (cx - tx) * ratio;
    ty = cy - (cy - ty) * ratio;
    scale = newScale;
    update();
  }, { passive: false });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) { cleanup(); overlay.remove(); }
  });

  applyBtn.onclick = () => {
    finalizeCrop(charId, slot, dataUrl, scale, tx, ty, img.naturalWidth, img.naturalHeight, vpW, vpH, cropW, cropH);
    cleanup();
    overlay.remove();
  };

  function cleanup() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
}

function finalizeCrop(charId, slot, dataUrl, scale, tx, ty, naturalW, naturalH, vpW, vpH, cropW, cropH) {
  const cfx = (vpW - cropW) / 2;
  const cfy = (vpH - cropH) / 2;
  const sx = (cfx - tx) / scale;
  const sy = (cfy - ty) / scale;
  const sw = cropW / scale;
  const sh = cropH / scale;

  const img = new Image();
  img.onload = () => {
    const scale2 = 2;
    const canvas = document.createElement('canvas');
    canvas.width = 120 * scale2;
    canvas.height = 153 * scale2;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 120 * scale2, 153 * scale2);
    customHeadImages[String(charId)] = canvas.toDataURL('image/png');
    const menu = document.querySelector('.head-variant-menu');
    if (menu) menu.remove();
    renderRecordImage(packPotentials());
    if (typeof renderChars === 'function') renderChars();
  };
  img.src = dataUrl;
}
