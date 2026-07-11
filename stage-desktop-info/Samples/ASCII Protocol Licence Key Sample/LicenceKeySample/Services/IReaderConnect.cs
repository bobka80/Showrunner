//-----------------------------------------------------------------------
// <copyright file="IReaderConnect.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Defines the interface between the ViewModel and the reader to establish a connection
    /// </summary>
    public interface IReaderConnect
    {
        /// <summary>
        /// Gets a value indicating whether a reader is currently connection
        /// </summary>
        bool IsConnected { get; }

        /// <summary>
        /// Gets the name of the last used / current connection to the reader
        /// </summary>
        string ConnectionName { get; }

        /// <summary>
        /// Connect to a reader
        /// </summary>
        /// <param name="connectionName">The connection to connect to</param>
        /// <returns>True if the reader connected</returns>
        bool Connect(string connectionName);

        /// <summary>
        /// Disconnect from the reader
        /// </summary>
        void Disconnect();

        /// <summary>
        /// Returns a list of available connection names
        /// </summary>
        /// <returns>The possible connections to a reader</returns>
        IEnumerable<string> EnumerateConnectionNames();
    }
}
