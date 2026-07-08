//-----------------------------------------------------------------------
// <copyright file="IdentifiedItemExtensions.cs" company="Technology Solutions UK Ltd"> 
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

    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Extension methods for <see cref="IIdentifiedItem"/>
    /// </summary>
    public static class IdentifiedItemExtensions
    {
        /// <summary>
        /// Convert the <see cref="BarcodeEventArgs"/> to an <see cref="IIdentifiedItem"/>
        /// </summary>
        /// <param name="barcode">The barcode to convert</param>
        /// <returns>The converted item</returns>
        public static IIdentifiedItem ToIdentifiedItem(this BarcodeEventArgs barcode)
        {
            IdentifiedItem item;

            item = new IdentifiedItem(barcode.Barcode, IdentifiedItem.TypeBarcode);
            if (DateTime.MinValue != barcode.Timestamp)
            {
                item.Properties.Add(IdentifiedItem.PropertyTimestamp, barcode.Timestamp.ToString("o"));
            }

            return item;
        }

        /// <summary>
        /// Convert the <see cref="TransponderData"/> to an <see cref="IIdentifiedItem"/>
        /// </summary>
        /// <param name="transponder">The transponder to convert</param>
        /// <returns>The converted item</returns>
        public static IIdentifiedItem ToIdentifiedItem(this TransponderData transponder)
        {
            IdentifiedItem item;

            if (string.IsNullOrEmpty(transponder.TransponderIdentifier))
            {
                item = new IdentifiedItem(transponder.Epc, IdentifiedItem.TypeTransponder);
            }
            else
            {
                string identifier;

                identifier = string.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "{0},{1}",
                    transponder.Epc,
                    transponder.TransponderIdentifier);
                item = new IdentifiedItem(identifier, IdentifiedItem.TypeTransponder);
            }

            if (transponder.Pc.HasValue)
            {
                item.AddProperty("PC", "{0:X4}", transponder.Pc.Value);
            }

            if (!string.IsNullOrEmpty(transponder.Epc))
            {
                item.AddProperty("EPC", "{0}", transponder.Epc);
            }

            if (transponder.Crc.HasValue)
            {
                item.AddProperty("CRC", "{0:X4}", transponder.Crc.Value);
            }

            if (transponder.Index.HasValue)
            {
                item.AddProperty("Index", "{0:D4}", transponder.Index.Value);
            }

            if (!string.IsNullOrEmpty(transponder.ReadData))
            {
                item.AddProperty("Data", "{0}", transponder.ReadData);
            }

            if (transponder.Rssi.HasValue)
            {
                item.AddProperty("RSSI", "{0:D2}dBm", transponder.Rssi.Value);
                item.Rssi = transponder.Rssi.Value;
            }

            if (transponder.TransponderAccessErrorCode.HasValue)
            {
                item.AddProperty(
                    "AccessError",
                    "{0}",
                    transponder.TransponderAccessErrorCode);
            }

            if (transponder.TransponderBackscatterErrorCode.HasValue)
            {
                item.AddProperty(
                    "BackscatterError",
                    "{0}",
                    transponder.TransponderBackscatterErrorCode);
            }

            if (!string.IsNullOrEmpty(transponder.TransponderIdentifier))
            {
                item.AddProperty("TID", "{0}", transponder.TransponderIdentifier);
            }

            if (transponder.WordsWritten.HasValue)
            {
                item.AddProperty("WordsWritten", "{0}", transponder.WordsWritten);
            }

            if (!DateTime.MinValue.Equals(transponder.Timestamp))
            {
                item.AddProperty("Timestamp", "{0:s}", transponder.Timestamp);
            }

            return item;
        }

        /// <summary>
        /// Add a property to an <see cref="IdentifiedItem"/>
        /// </summary>
        /// <param name="item">The item to add the property to</param>
        /// <param name="title">The name of the property</param>
        /// <param name="format">The format string for the value</param>
        /// <param name="value">The value of the property</param>
        public static void AddProperty(this IdentifiedItem item, string title, string format, object value)
        {
            item.Properties.Add(
                title,
                string.Format(System.Globalization.CultureInfo.InvariantCulture, format, value));
        }
    }
}
