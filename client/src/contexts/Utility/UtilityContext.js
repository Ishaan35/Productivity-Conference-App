import React, { useContext, useState, useEffect } from "react";

const UtilityContext = React.createContext();


export function useUtility() {
  return useContext(UtilityContext);
}

export function UtilityProvider({ children }) {
  //this function returns a callback with the compressed file url and compressed file object
  //Parameters: file, the three refs for previous image, canvas for processing, and final img output ref, and the callback
  //the first two jsx elements (html elements) can be hidden as the original image and the canvas do not need to be seen
  function compressImage(
    file,
    new_image_width,
    beforeCompressionImgRef,
    canvasRef,
    finalImageRef,
    callback
  ) {
    console.log(beforeCompressionImgRef, canvasRef, finalImageRef);
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      beforeCompressionImgRef.current.onload = function (event) {
        let ratio = new_image_width / event.target.width;
        canvasRef.current.width = new_image_width;
        canvasRef.current.height = event.target.height * ratio;

        const context = canvasRef.current.getContext("2d");
        context.drawImage(
          beforeCompressionImgRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        let new_final_image_url = context.canvas.toDataURL("image/jpeg", 100);
        finalImageRef.current.src = new_final_image_url;

        //get file blob and convert into file object
        const fileType = file.type;
        const fileName = file.name;
        let final_processed_image_file = dataURItoBlob(new_final_image_url);
        final_processed_image_file = new File(
          [final_processed_image_file],
          fileName,
          {
            type: fileType,
          }
        );
        //callback was passed through parameters, but now we return data through it since this onload event is not synchronous
        return callback({
          new_final_image_url: new_final_image_url,
          final_processed_image_file: final_processed_image_file,
        });
      };
      beforeCompressionImgRef.current.src = e.target.result; //result contains current image url before compression. then the onload event is called
    };
  }
  function dataURItoBlob(dataURI) {
    //Answer by Stoive on Stackoverflow. // https://stackoverflow.com/a/5100158

    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(",")[0].indexOf("base64") >= 0)
      byteString = atob(dataURI.split(",")[1]);
    else byteString = unescape(dataURI.split(",")[1]);

    // separate out the mime component
    var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
  }

  const value = {
    compressImage
  };

  

  return (
    <UtilityContext.Provider value={value}>
      {children}
    </UtilityContext.Provider>
  );
}