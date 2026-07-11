//-----------------------------------------------------------------------
// <copyright file="Service.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.Design;
    using System.Linq;
    using System.Reflection;
    using System.Text;

    using Entities;
    using Services;
    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.ModelViewViewModel.Services;

    /// <summary>
    /// Provides application wide access to services
    /// </summary>
    public static class Service
    {
        /// <summary>
        /// Updates the control used by the Dispatcher, for invoking to the UI thread, to be the main form
        /// </summary>
        /// <param name="mainForm">The main form of the application</param>
        public static void RegisterMainView(System.Windows.Forms.Form mainForm)
        {
            ((ControlDispatcher)ServiceProvider.Current.Get<IDispatcher>()).Control = mainForm;
        }

        /// <summary>
        /// Adds the services required by the application to the container
        /// </summary>
        /// <param name="container">The container to add the application services to</param>
        public static void RegisterServices(IServiceContainer container)
        {
            CommandService commands;

            ServiceProvider.Current = container;
            container.AddService(typeof(IDispatcher), new ControlDispatcher());

            // message service provide a way for application to route messages to the user interface
            container.AddService(typeof(MessageService), new MessageService());
            container.AddService(typeof(IMessageService), container.Get<MessageService>());

            // add the application settings 
            container.AddService(typeof(ICommonCommandParameters), new CommonCommandParameters());
            container.AddService(typeof(IObservableAntennaParameters), container.Get<ICommonCommandParameters>().Antenna);
            container.AddService(typeof(IObservableQueryParameters), container.Get<ICommonCommandParameters>().Query);
            container.AddService(typeof(IObservableSelectParameters), container.Get<ICommonCommandParameters>().Select);

            // identifier cache builds a list of unique transponders and barcodes seen
            container.AddService(typeof(IdentifierCacheService), new IdentifierCacheService());
            container.AddService(typeof(IIdentifierCache), container.Get<IdentifierCacheService>());
            container.AddService(typeof(Entities.InventoryCache), new Entities.InventoryCache());

            container.AddService(
                typeof(TechnologySolutions.Rfid.AsciiProtocol.DisplayResponder), 
                new TechnologySolutions.Rfid.AsciiProtocol.DisplayResponder());

            // File download responder captures a log file download
            // it is inserted in the top of the responder chain to capture a (potentially long) log file 
            // before any other responder is visited in the responder chain.
            // Added as a service as we want it disposed (to ensure any open file is closed) as the application terminates
            container.AddService(
                typeof(TechnologySolutions.Rfid.AsciiProtocol.FileDownloadResponder),
                new TechnologySolutions.Rfid.AsciiProtocol.FileDownloadResponder("LB", "LE"));

            // command and connect service handles setting up and communication with the UHF reader
            commands = new CommandService(
                container.Get<IMessageService>(),
                container.Get<IIdentifierCache>(),
                container.Get<TechnologySolutions.Rfid.AsciiProtocol.FileDownloadResponder>(),
                container.Get<TechnologySolutions.Rfid.AsciiProtocol.DisplayResponder>(),
                container.Get<Entities.InventoryCache>());
            container.AddService(typeof(IConnectionService), commands);
            container.AddService(typeof(ICommandService), commands);

            // register how to make view models for ViewModelLocator
            container.AddService(typeof(ViewModels.AntennaParametersViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.AutorunFileViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.BarcodeViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.CommandsViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.CommissionTransponderViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.ConfigureReaderViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.ConnectViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.IdentifiedItemsViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.InventoryViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.LockParametersViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.LogFileViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.QueryParametersViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.ReadWriteViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.ResponseParametersViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.ResponsesViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.SelectParametersViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.SwitchActionViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.SwitchViewModel), SingleConstructorResolver);
            container.AddService(typeof(ViewModels.TransponderParametersViewModel), SingleConstructorResolver);
        }

        /// <summary>
        /// Where serviceType has only one constructor defined and all the parameters for the constructor are
        /// identifiable by type in provider this fucntion can be used to create an instance of serviceType
        /// </summary>
        /// <param name="provider">A service provider to resolve the parameters of the constructor</param>
        /// <param name="serviceType">The type of service to create</param>
        /// <returns>
        /// An instance of the requested serviceType
        /// </returns>
        private static object SingleConstructorResolver(IServiceProvider provider, Type serviceType)
        {
            ConstructorInfo[] constructors;

            constructors = serviceType.GetConstructors();
            if (constructors.Length != 1)
            {
                throw new ArgumentException("More than one constructor is defined for " + serviceType.FullName);
            }

            return Resolve(provider, constructors.First());
        }

        /// <summary>
        /// Uses provider to resolve all the parameters of constructor and returns an instance
        /// </summary>
        /// <param name="provider">A service provider to resolve the parameters of the constructor</param>
        /// <param name="constructor">The constructor method to create the service</param>
        /// <returns>
        /// An instance of the constructor type
        /// </returns>
        private static object Resolve(IServiceProvider provider, ConstructorInfo constructor)
        {            
            object[] parameters;
            
            parameters = constructor.GetParameters().Select(x => provider.GetService(x.ParameterType)).ToArray();

            return constructor.Invoke(parameters);
        }
    }    
}
