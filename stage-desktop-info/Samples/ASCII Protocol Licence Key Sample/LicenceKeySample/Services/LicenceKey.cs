//-----------------------------------------------------------------------
// <copyright file="LicenceKey.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.Rfid.AsciiProtocol
{
    using System;
    using System.Collections.Generic;
    using System.Security.Cryptography;
    using System.Text;

    /// <summary>
    /// Provides functions to compute and verify a licence key from some values
    /// </summary>
    public static class LicenceKey
    {
        /// <summary>
        /// Compute a licence key to store in the reader based on the input values
        /// </summary>
        /// <param name="readerUniqueValue">A value that uniquely identifies the reader (e.g. serial number of Bluetooth MAC address)</param>
        /// <param name="company">A company name to identify the owner of the licence</param>
        /// <param name="secret">Some secret value to identify the application being licenced</param>
        /// <returns>The licence key value to store in the reader</returns>
        public static string Compute(string readerUniqueValue, string company, string secret)
        {
            string value;
            byte[] result;

            value = readerUniqueValue + company + secret;

            using (MD5 hash = MD5.Create())
            {
                result = hash.ComputeHash(Encoding.UTF8.GetBytes(value));
            }

            return Convert.ToBase64String(result);
        }

        /// <summary>
        /// Verify the licence key to ensure it matches the value provided
        /// </summary>
        /// <param name="readerUniqueValue">A value that uniquely identifies the reader (e.g. serial number of Bluetooth MAC address)</param>
        /// <param name="company">A company name to identify the owner of the licence</param>
        /// <param name="secret">Some secret value to identify the application being licenced</param>
        /// <param name="licenceKey">The licence key to verify</param>
        /// <returns>True if the licenceKey is valid for this reader, false otherwise</returns>
        public static bool Verify(string readerUniqueValue, string company, string secret, string licenceKey)
        {
            return !string.IsNullOrEmpty(licenceKey) &&
                licenceKey.Equals(Compute(readerUniqueValue, company, secret));
        }
    }
}
