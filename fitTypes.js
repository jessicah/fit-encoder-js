const ValueType = {
	enum: 0x00,
	sint8: 0x01,
	uint8: 0x02,
	sint16: 0x83,
	uint16: 0x84,
	sint32: 0x85,
	uint32: 0x86,
	string: 0x07,
	float32: 0x88,
	float64: 0x89,
	uint8z: 0x0A,
	uint16z: 0x8B,
	uint32z: 0x8C,
	byte: 0x0D,
	sint64: 0x8E,
	uint64: 0x8F,
	uint64z: 0x90
};

class Message {
	constructor(globalMessageNumber, messageClass, ...fieldNames)
	{
		this.globalMessageNumber = globalMessageNumber;
		this.writtenDefinitionMessage = false;
		this.fields = [];

		for (let key of fieldNames)
		{
			const field = messageClass[key];

			if (field === undefined)
				throw `unable to find ${key} in message definition`

			this.fields.push(new Field(field.id, field.type));
		}
	}

	// 16kB buffers
	static dataBuffer = null;

	static lastDefinitionMessage = null;

	get dataBuffer() { return Message.dataBuffer; }

	writeDefinition(definitions)
	{
		// is a definition message needed?
		// 1) if the last message differs by type; and
		// 2) it doesn't contain any variable length fields
		if (Message.lastDefinitionMessage == this.globalMessageNumber)
		{
			if (this.fields.every(field => field.type !== ValueType.string))
			{
				return;
			}
		}

		const headerSize = 6;
		let definitionSize = headerSize + (definitions.length * 3);
		let view = Message.dataBuffer.getChunk(definitionSize);

		view.setUint8(0, 0x40);
		view.setUint8(1, 0x00);
		view.setUint8(2, 0x00);
		view.setUint16(3, this.globalMessageNumber, true);
		view.setUint8(5, this.fields.length);

		for (const ix in definitions)
		{
			const definition = definitions[ix];
			view.setUint8(headerSize + (ix * 3), definition.field.id);
			view.setUint8(headerSize + (ix * 3 + 1), definition.size);
			view.setUint8(headerSize + (ix * 3 + 2), definition.field.type);
		}

		Message.lastDefinitionMessage = this.globalMessageNumber;
	}

	writeDataMessage(...values)
	{
		const items = this.fields.map((field, i) => {
			let descriptor = field.descriptor();
			let value = values[i];
			let size = field.type == ValueType.string
				? value.length + 1 : descriptor[0];
			return { field, value, size, descriptor }
		});

		this.writeDefinition(items);

		const headerSize = 1;
		let messageSize = items.reduce((acc, item) => acc + item.size, 0);

		let view = Message.dataBuffer.getChunk(headerSize + messageSize);
		view.setUint8(0, 0x00);
		let offset = 1;

		for (const item of items)
		{
			const func = item.descriptor[2];

			switch (item.field.type)
			{
				case ValueType.enum:
				case ValueType.uint8:
				case ValueType.sint8:
				case ValueType.byte:
				case ValueType.string:
					// neither of these take an endian parameter
					func.call(view, offset, item.field.value(item.value));
					break;
				case ValueType.sint64:
				case ValueType.uint64:
				case ValueType.uint64z:

				default:
					if (item.field.type > 0x90)
						throw `Invalid field type: ${item.field.type}`;

					// with endian set to little
					func.call(view, offset, item.field.value(item.value), true);
			}

			offset += item.size;
		}
	}
}

class Field {
	constructor(fieldId, valueType) {
		this.fieldId = fieldId;
		this.valueType = valueType;
	}

	get id() { return this.fieldId; }
	get type() {
		return this.descriptor()[3];
	}
	
	value(input) {
		if (input === undefined)
			// the invalid value
			return this.descriptor()[1];
		return input;
	}

	descriptor()
	{
		return Field.descriptorForType(this.valueType);
	}

	setString(offset, value)
	{
		for (let i = 0; i < value.length; ++i)
			this.setUint8(offset + i, value.charCodeAt(i));
		this.setUint8(offset + value.length, 0x00);
	}

	static descriptorForType(valueType)
	{
		switch (valueType)
		{
			case ValueType.enum:
				return [1, 0xFF, DataView.prototype.setUint8, ValueType.enum];
			case ValueType.sint8:
				return [1, 0x7F, DataView.prototype.setInt8, ValueType.sint8];
			case ValueType.uint8:
				return [1, 0xFF, DataView.prototype.setUint8, ValueType.uint8];
			case ValueType.sint16:
				return [2, 0x7FFF, DataView.prototype.setInt16, ValueType.sint16];
			case ValueType.uint16:
				return [2, 0xFFFF, DataView.prototype.setUint16, ValueType.uint16];
			case ValueType.sint32:
				return [4, 0x7FFFFFFF, DataView.prototype.setInt32, ValueType.sint32];
			case ValueType.uint32:
				return [4, 0xFFFFFFFF, DataView.prototype.setUint32, ValueType.uint32];
			case ValueType.string:
				return [1, "", Field.prototype.setString, ValueType.string];
			case ValueType.float32:
				return [4, 0xFFFFFFFF, DataView.prototype.setFloat32, ValueType.float32];
			case ValueType.float64:
				return [8, 0xFFFFFFFFFFFFFFFF, DataView.prototype.setFloat64, ValueType.float64];
			case ValueType.uint8z:
				return [1, 0x00, DataView.prototype.setUint8, ValueType.uint8z];
			case ValueType.uint16z:
				return [2, 0x0000, DataView.prototype.setUint16, ValueType.uint16z];
			case ValueType.uint32z:
				return [4, 0x00000000, DataView.prototype.setUint32, ValueType.uint32z];
			case ValueType.byte:
				return [1, 0xFF, DataView.prototype.setUint8, ValueType.byte];
			case ValueType.sint64:
				return [8, 0x7FFFFFFFFFFFFFFF, (dataView, offset) => {
					console.log('No support yet for signed 64-bit integers');
				}, ValueType.sint64];
			case ValueType.uint64:
				return [8, 0xFFFFFFFFFFFFFFFF, (dataView, offset) => {
					console.log('No support yet for unsigned 64-bit integers');
				}, ValueType.uint64];
			case ValueType.uint64z:
				return [8, 0x0000000000000000, (dataView, offset) => {
					console.log('No support yet for unsigned 64-bit integers');
				}, ValueType.uint64z];
			default:
				// Get the type from FitConstants
				return Field.descriptorForType(
					FitConstants.constant_types[valueType.__name]
				);
		}
	}
}
