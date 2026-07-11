//-----------------------------------------------------------------------
// <copyright file="DesignerCommandService.cs" company="Technology Solutions UK Ltd"> 
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
    /// Implementation of <see cref="ICommandService"/> that is used by the <see cref="ReaderCommand"/> class when used 
    /// in the Visual Studio designer rather than run time.
    /// </summary>
    public class DesignerCommandService
        : ICommandService
    {
        /// <summary>
        /// Raised when either the <see cref="IsConnected"/> or <see cref="IsInCommand"/> properties change
        /// </summary>
        public event EventHandler StateChanged;

        /// <summary>
        /// Gets a value indicating whether a reader is connected
        /// </summary>
        public bool IsConnected
        {
            get
            {
                return false;
            }
        }

        /// <summary>
        /// Gets a value indicating whether the reader is currently executing a synchronous command
        /// </summary>
        public bool IsInCommand
        {
            get
            {
                return false;
            }
        }

        /// <summary>
        /// Execute the command specified
        /// </summary>
        /// <param name="command">The command to execute</param>
        /// <param name="synchronous">
        /// True to execute the command synchronously.
        /// False to execute the command asynchronously.
        /// </param>
        /// <remarks>
        /// Synchronous commands block until complete and the command response is updated with the response to the command 
        /// via the synchronous responder in the responder chain.
        /// Asynchonous commands return once the command is sent and the response is (hopefully) handled by other responders in the responder chain
        /// </remarks>
        public void Execute(TechnologySolutions.Rfid.AsciiProtocol.IAsciiCommand command, bool synchronous)
        {
            throw new InvalidOperationException();
        }

        /// <summary>
        /// Raises the state changed event
        /// </summary>
        protected virtual void OnStateChanged()
        {
            EventHandler handler;

            handler = this.StateChanged;
            if (handler != null)
            {
                handler(this, EventArgs.Empty);
            }
        }
    }
}
