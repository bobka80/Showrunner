//-----------------------------------------------------------------------
// <copyright file="IdentifiedItem.cs" company="Technology Solutions UK Ltd"> 
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
    /// Represents a item scanned by the reader
    /// </summary>
    public interface IIdentifiedItem
    {
        /// <summary>
        /// Gets an indication of the type of item
        /// </summary>
        /// <remarks>
        /// e.g. "Barcode", "Transponder"
        /// </remarks>
        string ItemType { get; }

        /// <summary>
        /// Gets values that are associated with this item
        /// </summary>
        IDictionary<string, string> Properties { get; }

        /// <summary>
        /// Gets the RSSI (transponders only)
        /// </summary>
        int Rssi { get; }

        /// <summary>
        /// Gets a value that uniquely identifies this item
        /// </summary>
        /// <remarks>
        /// e.g. A barcode, EPC or EPC + TID
        /// </remarks>
        string UniqueIdentifier { get; }
    }

    /// <summary>
    /// Implementation of the <see cref="IIDentifiedItem"/>
    /// </summary>
    public class IdentifiedItem
        : IIdentifiedItem
    {
        /// <summary>
        /// Identifies the <see cref="ItemType"/> as Barcode
        /// </summary>
        public const string TypeBarcode = "Barcode";

        /// <summary>
        /// Identifies the <see cref="ItemType"/> as Transponder
        /// </summary>
        public const string TypeTransponder = "Transponder";

        /// <summary>
        /// Timestamp property name
        /// </summary>
        public const string PropertyTimestamp = "Timestamp";

        /// <summary>
        /// Initializes a new instance of the IdentifiedItem class
        /// </summary>
        /// <param name="uniqueIdentifier">The identified unique item</param>
        /// <param name="itemType">The type of the item</param>
        public IdentifiedItem(string uniqueIdentifier, string itemType)
        {
            if (string.IsNullOrEmpty(uniqueIdentifier))
            {
                throw new ArgumentNullException("uniqueIdentifier");
            }

            if (string.IsNullOrEmpty(itemType))
            {
                throw new ArgumentNullException("itemType");
            }

            this.ItemType = itemType;
            this.Properties = new Dictionary<string, string>();
            this.UniqueIdentifier = uniqueIdentifier;            
        }        

        /// <summary>
        /// Gets an indication of the type of item
        /// </summary>
        /// <remarks>
        /// e.g. "Barcode", "Transponder"
        /// </remarks>
        public string ItemType { get; private set; }

        /// <summary>
        /// Gets values that are associated with this item
        /// </summary>
        public IDictionary<string, string> Properties { get; private set; }

        /// <summary>
        /// Gets or sets the transponder RSSI
        /// </summary>
        public int Rssi { get; set; }

        /// <summary>
        /// Gets a value that uniquely identifies this item
        /// </summary>
        /// <remarks>
        /// e.g. A barcode, EPC or EPC + TID
        /// </remarks>
        public string UniqueIdentifier { get; private set; }
    }
}
