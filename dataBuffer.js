/*
	A wrapper around ArrayBuffers and DataView, as we don't
	actually know how much space we need, and we also write
	to our data sequentially, so we should be able to just
	ask for a write, without specifying an offset explicitly.
*/

class DataBuffer
{
	constructor(blockSize)
	{
		// data blocks making up the buffer
		this.blocks = [];

		// size of new blocks
		this.blockSize = blockSize;

		// add the initial block to start writing into
		this.#addBlock();
	}

	#addBlock()
	{
		let newBlock =
		{
			view: new DataView(new ArrayBuffer(this.blockSize)),
			offset: 0
		};

		this.blocks.push(newBlock);

		return newBlock;
	}

	// returns a DataView of size `bytesNeeded` starting at the
	// current position in the DataBuffer
	getChunk(bytesNeeded)
	{
		let block = this.#getBlockFor(bytesNeeded);
		let start = block.offset;
		block.offset += bytesNeeded;
		return new DataView(block.view.buffer, start, bytesNeeded);
	}

	getBufferSize()
	{
		return this.blocks.reduce((acc, block) => {
			return acc + block.offset;
		}, 0);
	}

	// returns an ArrayBuffer of the final result
	getFullBuffer()
	{
		const size = this.getBufferSize();
		const result = new Uint8Array(size);
		this.blocks.reduce((offset, block) => {
			result.set(
				// convert DataArray.buffer (ArrayBuffer) to Uint8Array,
				// then slice by the size of the used buffer
				new Uint8Array(block.view.buffer)
					.slice(0, block.offset),
				offset);
			return offset + block.offset;
		}, 0);

		return result.buffer;
	}

	#lastBlock()
	{
		return this.blocks[this.blocks.length - 1];
	}

	#getBlockFor(bytesNeeded)
	{
		let lastBlock = this.#lastBlock();

		if (lastBlock.offset + bytesNeeded >= lastBlock.view.byteLength)
		{
			lastBlock = this.#addBlock();
		}

		return lastBlock;
	}
}