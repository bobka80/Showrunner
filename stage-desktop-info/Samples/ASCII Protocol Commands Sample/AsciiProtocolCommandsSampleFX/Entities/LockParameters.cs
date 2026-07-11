//-----------------------------------------------------------------------
// <copyright file="LockParameters.cs" company="Technology Solutions UK Ltd"> 
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
    /// Defines an observable version of <see cref="ILockParameters"/>
    /// </summary>
    public interface IObservableLockParameters
        : System.ComponentModel.INotifyPropertyChanged, ILockParameters 
    {
    }

    /// <summary>
    /// Container for the lock payload parameters
    /// </summary>
    public class LockParameters
        : PropertyChangedEntityBase, IObservableLockParameters
    {
        /// <summary>
        /// Backing field for all parameters
        /// </summary>
        private LockPayload lockPayload = new LockPayload();

        /// <summary>
        /// Gets or sets the payload as used by the lock command
        /// </summary>
        public int Payload
        {
            get
            {
                return this.lockPayload.Payload;
            }

            set
            {
                if (this.lockPayload.Payload != value)
                {
                    this.lockPayload.Payload = value;
                    this.OnPropertyChanged("Payload");
                }
            }
        }
    }
}
