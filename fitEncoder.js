class FitEncoder {
	static unixEpoch = new Date(1970, 0, 1).getTime();
	static fitEpoch = new Date(1989, 11, 31).getTime();
	static headerSize = 14;

	static toFitTimestamp(date)
	{
		const milliseconds = date.getTime();

		return (milliseconds + FitEncoder.unixEpoch - FitEncoder.fitEpoch) / 1000;
	}

	static computeCrc(dataView, length)
	{
		const table =
		[
			0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
			0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400
		];

		var get16 = (crc, byte) =>
		{
			let tmp = 0;
			
			tmp = table[crc & 0xF];
			crc = (crc >> 4) & 0x0FFF;
			crc = crc ^ tmp ^ table[byte & 0xF];

			tmp = table[crc & 0xF];
			crc = (crc >> 4) & 0x0FFF;
			crc = crc ^ tmp ^ table[(byte >> 4) & 0xF];

			return crc & 0xFFFF;
		}

		let crc = 0;

		for (let i = 0; i < length; ++i)
		{
			crc = get16(crc, dataView.getUint8(i));
		}

		return crc;
	}

	writeHeader(dataLength)
	{
		console.log(`header with ${dataLength} bytes of data`);

		let dataView = this.header;

		// Header size
		dataView.setUint8(0, 14);
		// Protocol version: 1.0
		dataView.setUint8(1, 0x10);
		// Profile: 2184, can't remember what that means
		dataView.setUint16(2, 2184, true);
		// Data length
		dataView.setUint32(4, dataLength, true);
		// ".FIT"
		dataView.setUint8(8, 0x2E);
		dataView.setUint8(9, 0x46);
		dataView.setUint8(10, 0x49);
		dataView.setUint8(11, 0x54);
		// CRC of the header
		dataView.setUint16(12, FitEncoder.computeCrc(dataView, 12), true);
	}

	constructor()
	{
		Message.dataBuffer = new DataBuffer(16384);

		this.header = Message.dataBuffer.getChunk(FitEncoder.headerSize);
	}

	getFile()
	{
		// Reserve space for the CRC
		Message.dataBuffer.getChunk(2);

		const headerPlusCrcSize = 16;
		const finalSize = Message.dataBuffer.getBufferSize();

		console.log(`written ${finalSize} of data`);

		// 16 = FIT Header + Trailing CRC
		this.writeHeader(finalSize - headerPlusCrcSize);

		const buffer = Message.dataBuffer.getFullBuffer();
		Message.dataBuffer = null;

		let dataView = new DataView(buffer);

		const crc = FitEncoder.computeCrc(dataView, buffer.byteLength - 2);

		dataView.setUint16(buffer.byteLength - 2, crc, true);

		return buffer;
	}
}
