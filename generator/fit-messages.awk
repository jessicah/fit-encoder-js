#!/bin/awk

BEGIN {
	FS=","
	first = 1
	printf "class FitMessages {\n"
}

$1 !~ /^$/ {
	if (first == 0) {
		printf "\t};\n\n"
	}
	printf "\tstatic %s = {\n", $1
	first = 0
}
$1 ~ /^$/ && $2 !~ /^$/ && $4 ~ /^(enum|sint8|uint8|sint16|uint16|sint32|uint32|string|float32|float64|uint8z|uint16z|uint32z|byte|sint64|uint64|uint64z)$/ {
	printf "\t\t\"%s\": new Field(%d, ValueType.%s),\n", $3, $2, $4
}
$1 ~ /^$/ && $2 !~ /^$/ && $4 !~ /^(enum|sint8|uint8|sint16|uint16|sint32|uint32|string|float32|float64|uint8z|uint16z|uint32z|byte|sint64|uint64|uint64z)$/ {
	printf "\t\t\"%s\": new Field(%d, FitConstants.%s),\n", $3, $2, $4
}

END {
	printf "\t};\n}\n\n"
}

