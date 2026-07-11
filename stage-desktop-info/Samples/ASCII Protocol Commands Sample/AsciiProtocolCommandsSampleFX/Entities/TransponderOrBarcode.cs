//-----------------------------------------------------------------------
// <copyright file="TransponderOrBarcode.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Represents a transponder or barcode that is returned from the reader that can be used as a target for read or write
    /// </summary>
    public class TransponderOrBarcode
    {
        /// <summary>
        /// Gets or sets the transponder EPC or barcode
        /// </summary>
        public string Identifier { get; set; }

        /// <summary>
        /// Gets or sets the TID of the transponder
        /// </summary>
        public string Tid { get; set; }

        /// <summary>
        /// Gets or sets the timestamp when the last seen
        /// </summary>
        public DateTime LastSeen { get; set; }

        /// <summary>
        /// Gets a key derived  to identify a unique transponder or barcode
        /// </summary>
        public string Key
        {
            get
            {
                return this.Identifier + this.Tid;
            }
        }

        /// <summary>
        /// Returns a string representation of this instance
        /// </summary>
        /// <returns>A string representation of this instance</returns>
        public override string ToString()
        {
            return string.Format(
                System.Globalization.CultureInfo.InvariantCulture,
                "Identifier {0}, TID {1}, Seen {2}",
                this.Identifier,
                this.Tid,
                this.LastSeen);
        }
    }
}
