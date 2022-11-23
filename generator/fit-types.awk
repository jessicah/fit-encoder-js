#!/bin/awk

BEGIN {
	FS=","
	PROCINFO["sorted_in"] = "@ind_str_asc"

	printf "class FitConstants {\n\n";
}

$1 !~ /^$/ { name=$1; types[name] = $2 }
$1 ~ /^$/  { kv[name,NR] = sprintf("\"%s\": %d", $3, $4) }

END {
	last=0
	for (combined in kv) {
		split(combined, separate, SUBSEP);
		if (separate[1] != last) {
			if (last != 0) {
				printf "\t};\n\n";
			}
			printf "\tstatic %s = {\n", separate[1];
			printf "\t\t__name: \"%s\",\n", separate[1];
			last = separate[1];
		}

		printf "\t\t%s,\n", kv[separate[1], separate[2]];
	}

	printf("\t};\n\n");

	printf "\tstatic constant_types = {\n";

	for (t in types) {
		printf "\t\t%s: ValueType.%s,\n", t, types[t];
	}

	printf "\t};\n\n};\n";
}
