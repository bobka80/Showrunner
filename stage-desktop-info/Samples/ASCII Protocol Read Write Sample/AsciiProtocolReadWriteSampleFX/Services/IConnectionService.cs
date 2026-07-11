//-----------------------------------------------------------------------
// <copyright file="IConnectionService.cs" company="Technology Solutions UK Ltd"> 
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

    /// <summary>
    /// Provides methods and properties to manage a connection to a reader
    /// </summary>
    public interface IConnectionService
    {
        /// <summary>
        /// Gets a value indicating whether the reader is connected
        /// </summary>
        bool IsConnected { get; }

        /// <summary>
        /// Gets or sets the port name to access the reader 
        /// </summary>
        string PortName { get; set; }

        /// <summary>
        /// Attempt to connect ot the reader on the specifed <see cref="PortName"/>
        /// </summary>
        void Connect();

        /// <summary>
        /// If connected disconnect from the current reader
        /// </summary>
        void Disconnect();
    }
}
