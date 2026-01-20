import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'

const CustomSignatureCanvas = forwardRef((props, ref) => {
  const sigCanvas = useRef()

  useImperativeHandle(ref, () => ({
    clear: () => {
      sigCanvas.current.clear()
    },
    getSignatureData: () => {
      if (sigCanvas.current.isEmpty()) {
        return null
      }
      return sigCanvas.current.toDataURL()
    }
  }))

  return (
    <div className="border border-gray-300 rounded-lg">
      <SignatureCanvas
        ref={sigCanvas}
        canvasProps={{
          width: props.width || 400,
          height: props.height || 200,
          className: 'signature-canvas'
        }}
        {...props}
      />
    </div>
  )
})

CustomSignatureCanvas.displayName = 'SignatureCanvas'

export default CustomSignatureCanvas