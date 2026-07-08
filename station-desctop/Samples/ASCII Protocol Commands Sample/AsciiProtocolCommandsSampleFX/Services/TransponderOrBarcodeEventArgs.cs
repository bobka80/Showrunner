//-----------------------------------------------------------------------
// <copyright file="TransponderOrBarcodeEventArgs.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Entities;

    /// <summary>
    /// EventArgs identifying a <see cref="TransponderOrBarcode"/> item
    /// </summary>
    public class TransponderOrBarcodeEventArgs
        : EventArgs
    {
        /// <summary>
        /// Initializes a new instance of the TransponderOrBarcodeEventArgs class
        /// </summary>
        /// <param name="value">The value for the EventArgs</param>
        public TransponderOrBarcodeEventArgs(TransponderOrBarcode value)
        {
            this.Value = value;
        }

        /// <summary>
        /// Gets the Value
        /// </summary>
        public TransponderOrBarcode Value { get; private set; }
    }
}
