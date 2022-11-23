# fit-encoder-js

Provides a couple of classes for generating FIT files in JavaScript. There
are also some examples to show how to write an encoder for a given FIT file.

- `fitConstants` contains all the enum definitions used by various messages.
- `fitMessages` defines each available field in the defined messages.
- `fitTypes` has the classes used to define messages used for encoding
  your file.
- `fitEncoder` is the base type for your encoder.

The basic format is to write a class that extends `FitEncoder`. You can then
define the messages you will be using, then write data messages as needed. A
message has the form of:
```
  let myMessage = new Message(FitConstants.mesg_num.MESSAGE_TYPE,
    FitMessages.MESSAGE_TYPE,
    "field1",
    ...
    "fieldN");
```

You can then write data messages as follows:
```
  myMessage.writeDataMessage(
    field1,
    ...
    fieldN);
```

You can also combine the above, if you only need that particular type of message
once, like so:
```
  new Message(...).writeDataMessage(...);
```

Once your message has been written, you can call `getFile()` on your
encoder object, which will write the header and the trailing CRC, and
return a `Uint8Array` that you can then use for downloading, etc.

Automatically downloading the file can look something like:
```
  // either generate the contents in the constructor directly,
  // or define a method to call...
  var encoder = new MyEncoder(options...);
  
  // create an Object URL
  const url = URL.createObjectURL(new Block([encoder.getFile()],
      { type: 'application/octet' });
  
  // create a temporary link and trigger its 'click' event
  const link = document.createElement('a');
  link.href = url;
  link.download = 'some file.fit';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // clean up resources, otherwise you'll leak memory
  URL.revokeObjectURL(url);
  link.remove();
```

`FitEncoder` also has a helper function, `FitEncoder.toFitTimestamp` to
convert a JavaScript Date object into a FIT timestamp.

Currently, the main limitation is that scale and offset are not applied
automatically, so you'll need to refer to the FIT SDK to see if you need
to apply one or both of these to a given field.

