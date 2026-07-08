//-----------------------------------------------------------------------
// <copyright file="IReaderCommand.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;

    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Defines the interface between the ViewModels and the reader
    /// </summary>
    public interface IReaderCommand
    {
        /// <summary>
        /// Raised when IsConnected changes
        /// </summary>
        event EventHandler IsConnectedChanged;

        /// <summary>
        /// Raised when IsExecutingCommand changes
        /// </summary>
        event EventHandler IsExecutingCommandChanged;

        /// <summary>
        /// Gets a value indicating whether a reader is connected
        /// </summary>
        bool IsConnected { get; }

        /// <summary>
        /// Gets a value indicating whether the reader is currently executing a command
        /// </summary>
        bool IsExecutingCommand { get; }

        /// <summary>
        /// Executes command
        /// </summary>
        /// <param name="command">The command to execute</param>
        /// <param name="synchronous">True to execute the command synchronously. False to execute the command asynchronously</param>
        void ExecuteAsciiCommand(IAsciiCommand command, bool synchronous);
    }
}
